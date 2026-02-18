import express from 'express'
import {
    getMyActivityChats,
    getActivityChatMessages,
    sendActivityChatMessage,
    uploadChatFile as uploadChatFileController,
} from '../controllers/chatController.js'
import { protect } from '../middleware/auth.js'
import { uploadChatFile } from '../middleware/upload.js'

const router = express.Router()

router.use(protect)

router.post('/upload', uploadChatFile.single('file'), uploadChatFileController)
router.get('/activity', getMyActivityChats)
router.get('/activity/:activityId/messages', getActivityChatMessages)
router.post('/activity/:activityId/messages', sendActivityChatMessage)

export default router
