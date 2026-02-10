import express from 'express'
import { 
    createActivity, 
    getActivities, 
    getActivityById,
    getNearbyActivities,
    joinActivity, 
    leaveActivity,
    updateActivityStatus,
    deleteActivity
} from '../controllers/activityController.js'
import { protect } from '../middleware/auth.js'
import { validateActivity } from '../middleware/validators.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Activity CRUD routes
router.post('/', validateActivity, createActivity)
router.get('/', getActivities)
router.get('/nearby', getNearbyActivities)
router.get('/:id', getActivityById)
router.delete('/:id', deleteActivity)

// Activity participation routes
router.post('/:id/join', joinActivity)
router.post('/:id/leave', leaveActivity)

// Activity status update
router.patch('/:id/status', updateActivityStatus)

export default router
