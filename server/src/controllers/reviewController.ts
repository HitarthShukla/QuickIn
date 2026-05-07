import { Request, Response } from 'express'
import Review from '../models/Review.js'
import Activity from '../models/Activity.js'
import User from '../models/User.js'

// @desc    Submit a review for a user in a completed activity
// @route   POST /api/activities/:activityId/reviews
// @access  Private
export const submitReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const { revieweeId, rating, feedback } = req.body
        const reviewerId = req.userId

        if (reviewerId === revieweeId) {
            res.status(400).json({ success: false, message: 'You cannot review yourself' })
            return
        }

        const activity = await Activity.findById(activityId)
        if (!activity) {
            res.status(404).json({ success: false, message: 'Activity not found' })
            return
        }

        if (activity.status !== 'completed') {
            res.status(400).json({ success: false, message: 'Can only review completed activities' })
            return
        }

        // Verify both are part of the activity
        const participantsAndCreator = [...activity.participants.map(p => p.toString()), activity.creator.toString()]
        
        if (!participantsAndCreator.includes(reviewerId as string)) {
            res.status(403).json({ success: false, message: 'You were not part of this activity' })
            return
        }

        if (!participantsAndCreator.includes(revieweeId as string)) {
            res.status(400).json({ success: false, message: 'Reviewee was not part of this activity' })
            return
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ activity: activityId, reviewer: reviewerId, reviewee: revieweeId })
        if (existingReview) {
            res.status(400).json({ success: false, message: 'You have already reviewed this user for this activity' })
            return
        }

        const review = await Review.create({
            activity: activityId,
            reviewer: reviewerId,
            reviewee: revieweeId,
            rating,
            feedback
        })

        // Recalculate trust score
        const allReviews = await Review.find({ reviewee: revieweeId })
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0)
        const newTrustScore = totalRating / allReviews.length

        await User.findByIdAndUpdate(revieweeId, { trustScore: newTrustScore })

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review
        })
    } catch (error) {
        console.error('Submit review error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while submitting review'
        })
    }
}

// @desc    Get user IDs that the current user has reviewed for an activity
// @route   GET /api/activities/:activityId/reviews/me
// @access  Private
export const getMyReviewedUsersForActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const reviewerId = req.userId
        
        const reviews = await Review.find({ activity: activityId, reviewer: reviewerId })
        const reviewedUserIds = reviews.map(r => r.reviewee.toString())
        
        res.status(200).json({
            success: true,
            reviewedUserIds
        })
    } catch (error) {
        console.error('Get reviewed users error:', error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}