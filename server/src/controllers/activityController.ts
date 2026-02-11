import { Request, Response } from 'express'
import Activity from '../models/Activity.js'

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private
export const createActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            title, 
            description, 
            type, 
            location, 
            dateTime, 
            duration,
            maxParticipants,
            interests,
            requirements,
            image 
        } = req.body

        const activity = await Activity.create({
            creator: req.userId,
            title,
            description,
            type,
            location,
            dateTime,
            duration,
            maxParticipants,
            participants: [req.userId], // Creator automatically joins
            interests,
            requirements,
            image,
            status: 'open'
        })

        const populatedActivity = await Activity.findById(activity._id)
            .populate('creator', 'name avatar trustScore')
            .populate('participants', 'name avatar')

        res.status(201).json({
            success: true,
            activity: populatedActivity,
        })
    } catch (error: any) {
        console.error('Create activity error:', error)
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while creating activity',
        })
    }
}

// @desc    Get all activities with filters
// @route   GET /api/activities
// @access  Private
export const getActivities = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        const type = req.query.type as string
        const status = (req.query.status as string) || 'open'
        const timeFilter = req.query.time as string // 'now', 'today', 'week'

        // Build query
        const query: any = {}

        if (type && type !== 'all') {
            query.type = type
        }

        if (status !== 'all') {
            query.status = status
        }

        // Time filters
        const now = new Date()
        if (timeFilter === 'now') {
            // Activities happening within the next 2 hours
            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
            query.dateTime = { $gte: now, $lte: twoHoursLater }
        } else if (timeFilter === 'today') {
            const endOfDay = new Date(now)
            endOfDay.setHours(23, 59, 59, 999)
            query.dateTime = { $gte: now, $lte: endOfDay }
        } else if (timeFilter === 'week') {
            const endOfWeek = new Date(now)
            endOfWeek.setDate(now.getDate() + 7)
            query.dateTime = { $gte: now, $lte: endOfWeek }
        } else {
            // Default: all future activities
            query.dateTime = { $gte: now }
        }

        const total = await Activity.countDocuments(query)
        const activities = await Activity.find(query)
            .sort({ dateTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate('creator', 'name avatar trustScore badges')
            .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            count: activities.length,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
            },
            activities,
        })
    } catch (error) {
        console.error('Get activities error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching activities',
        })
    }
}

// @desc    Get nearby activities
// @route   GET /api/activities/nearby
// @access  Private
export const getNearbyActivities = async (req: Request, res: Response): Promise<void> => {
    try {
        const { longitude, latitude, radius = 10 } = req.query

        if (!longitude || !latitude) {
            res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required',
            })
            return
        }

        const lng = parseFloat(longitude as string)
        const lat = parseFloat(latitude as string)
        const radiusInKm = parseFloat(radius as string)

        // Convert radius from km to meters for MongoDB
        const radiusInMeters = radiusInKm * 1000

        const activities = await Activity.find({
            status: 'open',
            dateTime: { $gte: new Date() },
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: radiusInMeters
                }
            }
        })
        .limit(50)
        .populate('creator', 'name avatar trustScore badges')
        .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            count: activities.length,
            activities,
        })
    } catch (error) {
        console.error('Get nearby activities error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching nearby activities',
        })
    }
}

// @desc    Get single activity by ID
// @route   GET /api/activities/:id
// @access  Private
export const getActivityById = async (req: Request, res: Response): Promise<void> => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('creator', 'name avatar bio trustScore badges')
            .populate('participants', 'name avatar trustScore')

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        res.status(200).json({
            success: true,
            activity,
        })
    } catch (error) {
        console.error('Get activity error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching activity',
        })
    }
}

// @desc    Join activity
// @route   POST /api/activities/:id/join
// @access  Private
export const joinActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const activity = await Activity.findById(req.params.id)

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Check if activity is full
        if (activity.participants.length >= activity.maxParticipants) {
            res.status(400).json({
                success: false,
                message: 'Activity is full',
            })
            return
        }

        // Check if user already joined
        if (activity.participants.some(p => p.toString() === req.userId)) {
            res.status(400).json({
                success: false,
                message: 'You have already joined this activity',
            })
            return
        }

        // Check if activity is still open
        if (activity.status !== 'open') {
            res.status(400).json({
                success: false,
                message: 'Activity is no longer open for joining',
            })
            return
        }

        // Add user to participants
        activity.participants.push(req.userId as any)
        await activity.save()

        const updatedActivity = await Activity.findById(activity._id)
            .populate('creator', 'name avatar trustScore badges')
            .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            message: 'Successfully joined activity',
            activity: updatedActivity,
        })
    } catch (error) {
        console.error('Join activity error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while joining activity',
        })
    }
}

// @desc    Leave activity
// @route   POST /api/activities/:id/leave
// @access  Private
export const leaveActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const activity = await Activity.findById(req.params.id)

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Check if user is the creator
        if (activity.creator.toString() === req.userId) {
            res.status(400).json({
                success: false,
                message: 'Creator cannot leave the activity. Cancel it instead.',
            })
            return
        }

        // Check if user is in participants
        const participantIndex = activity.participants.findIndex(
            p => p.toString() === req.userId
        )

        if (participantIndex === -1) {
            res.status(400).json({
                success: false,
                message: 'You are not a participant of this activity',
            })
            return
        }

        // Remove user from participants
        activity.participants.splice(participantIndex, 1)
        await activity.save()

        const updatedActivity = await Activity.findById(activity._id)
            .populate('creator', 'name avatar trustScore badges')
            .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            message: 'Successfully left activity',
            activity: updatedActivity,
        })
    } catch (error) {
        console.error('Leave activity error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while leaving activity',
        })
    }
}

// @desc    Update activity status
// @route   PATCH /api/activities/:id/status
// @access  Private (Creator only)
export const updateActivityStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.body
        const activity = await Activity.findById(req.params.id)

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can update status
        if (activity.creator.toString() !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Only the creator can update activity status',
            })
            return
        }

        activity.status = status
        await activity.save()

        const updatedActivity = await Activity.findById(activity._id)
            .populate('creator', 'name avatar trustScore badges')
            .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            message: 'Activity status updated',
            activity: updatedActivity,
        })
    } catch (error) {
        console.error('Update status error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while updating activity status',
        })
    }
}

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private (Creator only)
export const updateActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const activity = await Activity.findById(req.params.id)

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can update
        if (activity.creator.toString() !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Only the creator can update this activity',
            })
            return
        }

        const { 
            title, 
            description, 
            type, 
            location, 
            dateTime, 
            duration,
            maxParticipants,
            interests,
            requirements,
            image 
        } = req.body

        // Update fields if provided
        if (title) activity.title = title
        if (description) activity.description = description
        if (type) activity.type = type
        if (location) activity.location = location
        if (dateTime) activity.dateTime = dateTime
        if (duration) activity.duration = duration
        if (maxParticipants) activity.maxParticipants = maxParticipants
        if (interests) activity.interests = interests
        if (requirements) activity.requirements = requirements
        if (image !== undefined) activity.image = image

        await activity.save()

        const updatedActivity = await Activity.findById(activity._id)
            .populate('creator', 'name avatar trustScore badges')
            .populate('participants', 'name avatar')

        res.status(200).json({
            success: true,
            message: 'Activity updated successfully',
            activity: updatedActivity,
        })
    } catch (error: any) {
        console.error('Update activity error:', error)
        res.status(500).json({
            success: false,
            message: error.message || 'Server error while updating activity',
        })
    }
}

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private (Creator only)
export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const activity = await Activity.findById(req.params.id)

        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can delete
        if (activity.creator.toString() !== req.userId) {
            res.status(403).json({
                success: false,
                message: 'Only the creator can delete this activity',
            })
            return
        }

        await Activity.findByIdAndDelete(req.params.id)

        res.status(200).json({
            success: true,
            message: 'Activity deleted successfully',
        })
    } catch (error) {
        console.error('Delete activity error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while deleting activity',
        })
    }
}
