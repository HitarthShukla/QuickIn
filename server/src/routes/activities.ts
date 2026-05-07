import express from 'express'
import { 
    createActivity, 
    getActivities, 
    getActivityById,
    getNearbyActivities,
    joinActivity, 
    leaveActivity,
    updateActivityStatus,
    updateActivity,
    deleteActivity
} from '../controllers/activityController.js'
import {
    sendJoinRequest,
    getJoinRequests,
    acceptJoinRequest,
    rejectJoinRequest,
    removeParticipant
} from '../controllers/joinRequestController.js'
import {
    submitReview,
    getMyReviewedUsersForActivity
} from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'
import { validateActivity } from '../middleware/validators.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Review routes
router.post('/:activityId/reviews', submitReview)
router.get('/:activityId/reviews/me', getMyReviewedUsersForActivity)

// Activity CRUD routes
router.post('/', ...validateActivity, createActivity)
router.get('/', getActivities)
router.get('/nearby', getNearbyActivities)
router.get('/:id', getActivityById)
router.put('/:id', ...validateActivity, updateActivity)
router.delete('/:id', deleteActivity)

// Activity participation routes
router.post('/:id/join', joinActivity)
router.post('/:id/leave', leaveActivity)

// Join request routes
router.post('/:activityId/join-request', sendJoinRequest)
router.get('/:activityId/join-requests', getJoinRequests)
router.put('/:activityId/join-requests/:requestId/accept', acceptJoinRequest)
router.put('/:activityId/join-requests/:requestId/reject', rejectJoinRequest)

// Participant management
router.delete('/:activityId/participants/:participantId', removeParticipant)

// Activity status update
router.patch('/:id/status', updateActivityStatus)

export default router
