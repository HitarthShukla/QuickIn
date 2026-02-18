import { Request, Response } from 'express'
import JoinRequest from '../models/JoinRequest.js'
import Activity from '../models/Activity.js'
import { addParticipantToActivityChat } from '../services/activityChatService.js'
import { getSocketServer } from '../socket/server.js'

// @desc    Send join request for an activity
// @route   POST /api/activities/:activityId/join-request
// @access  Private
export const sendJoinRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const { message } = req.body
        const userId = req.userId

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Check if activity is request-based
        if (activity.joinType !== 'request') {
            res.status(400).json({
                success: false,
                message: 'This activity does not require join requests',
            })
            return
        }

        // Check if already a participant
        if (activity.participants.includes(userId as any)) {
            res.status(400).json({
                success: false,
                message: 'You are already a participant',
            })
            return
        }

        // Check if already sent a request
        const existingRequest = await JoinRequest.findOne({
            activity: activityId,
            user: userId,
        })

        if (existingRequest) {
            res.status(400).json({
                success: false,
                message: existingRequest.status === 'pending' 
                    ? 'You have already sent a join request' 
                    : 'You have already sent a request that was ' + existingRequest.status,
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

        const joinRequest = await JoinRequest.create({
            activity: activityId,
            user: userId,
            message: message?.trim(),
        })

        const populatedRequest = await JoinRequest.findById(joinRequest._id)
            .populate('user', 'name avatar email')
            .populate('activity', 'title')

        // Emit socket event to activity creator and broadcast to activity room
        const io = getSocketServer()
        if (io) {
            io.to(`user:${activity.creator.toString()}`).emit('activity:join-request:new', {
                activityId,
                request: populatedRequest,
            })
            // Broadcast to all users viewing this activity
            io.emit('activity:join-request:sent', {
                activityId,
                userId,
            })
        }

        res.status(201).json({
            success: true,
            message: 'Join request sent successfully',
            request: populatedRequest,
        })
    } catch (error) {
        console.error('Send join request error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while sending join request',
        })
    }
}

// @desc    Get join requests for an activity (creator only)
// @route   GET /api/activities/:activityId/join-requests
// @access  Private
export const getJoinRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const userId = req.userId

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can see join requests
        if (activity.creator.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Only the activity creator can view join requests',
            })
            return
        }

        const requests = await JoinRequest.find({ activity: activityId, status: 'pending' })
            .populate('user', 'name avatar email bio interests activeZones languages badges trustScore attendanceScore')
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            count: requests.length,
            requests,
        })
    } catch (error) {
        console.error('Get join requests error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching join requests',
        })
    }
}

// @desc    Accept join request
// @route   PUT /api/activities/:activityId/join-requests/:requestId/accept
// @access  Private
export const acceptJoinRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId, requestId } = req.params
        const userId = req.userId

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can accept requests
        if (activity.creator.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Only the activity creator can accept join requests',
            })
            return
        }

        const joinRequest = await JoinRequest.findById(requestId)
        if (!joinRequest) {
            res.status(404).json({
                success: false,
                message: 'Join request not found',
            })
            return
        }

        if (joinRequest.activity.toString() !== activityId) {
            res.status(400).json({
                success: false,
                message: 'Request does not belong to this activity',
            })
            return
        }

        if (joinRequest.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Request has already been processed',
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

        // Add user to participants
        activity.participants.push(joinRequest.user)
        await activity.save()

        // Update request status
        joinRequest.status = 'accepted'
        await joinRequest.save()

        // Add to activity chat
        await addParticipantToActivityChat(activityId, joinRequest.user.toString())

        const populatedActivity = await Activity.findById(activityId)
            .populate('creator', 'name avatar')
            .populate('participants', 'name avatar')

        // Emit socket events
        const io = getSocketServer()
        if (io) {
            // Notify the requester
            io.to(`user:${joinRequest.user.toString()}`).emit('activity:join-request:accepted', {
                activityId,
                activity: populatedActivity,
            })

            // Broadcast to all users viewing this activity
            io.emit('activity:participant:joined', {
                activityId,
                participant: (await joinRequest.populate('user', 'name avatar')).user,
            })
        }

        res.status(200).json({
            success: true,
            message: 'Join request accepted',
            activity: populatedActivity,
        })
    } catch (error) {
        console.error('Accept join request error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while accepting join request',
        })
    }
}

// @desc    Reject join request
// @route   PUT /api/activities/:activityId/join-requests/:requestId/reject
// @access  Private
export const rejectJoinRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId, requestId } = req.params
        const userId = req.userId

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can reject requests
        if (activity.creator.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Only the activity creator can reject join requests',
            })
            return
        }

        const joinRequest = await JoinRequest.findById(requestId)
        if (!joinRequest) {
            res.status(404).json({
                success: false,
                message: 'Join request not found',
            })
            return
        }

        if (joinRequest.activity.toString() !== activityId) {
            res.status(400).json({
                success: false,
                message: 'Request does not belong to this activity',
            })
            return
        }

        if (joinRequest.status !== 'pending') {
            res.status(400).json({
                success: false,
                message: 'Request has already been processed',
            })
            return
        }

        // Update request status
        joinRequest.status = 'rejected'
        await joinRequest.save()

        // Emit socket event to requester
        const io = getSocketServer()
        if (io) {
            io.to(`user:${joinRequest.user.toString()}`).emit('activity:join-request:rejected', {
                activityId,
            })
            // Broadcast to all users viewing this activity
            io.emit('activity:join-request:updated', {
                activityId,
                requestId,
            })
        }

        res.status(200).json({
            success: true,
            message: 'Join request rejected',
        })
    } catch (error) {
        console.error('Reject join request error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while rejecting join request',
        })
    }
}

// @desc    Remove participant from activity
// @route   DELETE /api/activities/:activityId/participants/:participantId
// @access  Private
export const removeParticipant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId, participantId } = req.params
        const userId = req.userId

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({
                success: false,
                message: 'Activity not found',
            })
            return
        }

        // Only creator can remove participants
        if (activity.creator.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: 'Only the activity creator can remove participants',
            })
            return
        }

        // Cannot remove creator
        if (participantId === activity.creator.toString()) {
            res.status(400).json({
                success: false,
                message: 'Cannot remove the activity creator',
            })
            return
        }

        // Check if user is a participant
        const participantIndex = activity.participants.findIndex(
            (p) => p.toString() === participantId
        )

        if (participantIndex === -1) {
            res.status(400).json({
                success: false,
                message: 'User is not a participant of this activity',
            })
            return
        }

        // Remove participant
        activity.participants.splice(participantIndex, 1)
        await activity.save()

        // Remove from activity chat
        const { removeParticipantFromActivityChat } = await import('../services/activityChatService.js')
        await removeParticipantFromActivityChat(activityId, participantId)

        // Emit socket events
        const io = getSocketServer()
        if (io) {
            io.to(`user:${participantId}`).emit('activity:removed', {
                activityId,
            })

            // Broadcast to all users viewing this activity
            io.emit('activity:participant:left', {
                activityId,
                participantId,
            })
        }

        res.status(200).json({
            success: true,
            message: 'Participant removed successfully',
        })
    } catch (error) {
        console.error('Remove participant error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while removing participant',
        })
    }
}
