import { Request, Response } from 'express'
import ActivityChat from '../models/ActivityChat.js'
import ActivityChatMessage from '../models/ActivityChatMessage.js'
import { ensureActivityChat } from '../services/activityChatService.js'
import { getSocketServer } from '../socket/server.js'

const activityChatRoomName = (chatId: string): string => `activity-chat:${chatId}`

// @desc    Get all activity chats for current user
// @route   GET /api/chats/activity
// @access  Private
export const getMyActivityChats = async (req: Request, res: Response): Promise<void> => {
    try {
        const chats = await ActivityChat.find({ participants: req.userId })
            .sort({ updatedAt: -1 })
            .populate('participants', 'name avatar')
            .populate({
                path: 'activity',
                select: 'title status dateTime creator joinType',
                populate: {
                    path: 'creator',
                    select: '_id name'
                }
            })

        res.status(200).json({
            success: true,
            count: chats.length,
            chats,
        })
    } catch (error) {
        console.error('Get chats error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching chats',
        })
    }
}

// @desc    Get activity chat messages
// @route   GET /api/chats/activity/:activityId/messages
// @access  Private
export const getActivityChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100)
        const before = req.query.before as string | undefined

        const chat = await ensureActivityChat(activityId)
        if (!chat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found for this activity',
            })
            return
        }

        const isParticipant = chat.participants.some((participant) => participant.toString() === req.userId)
        if (!isParticipant) {
            res.status(403).json({
                success: false,
                message: 'You are not a participant of this activity chat',
            })
            return
        }

        const query: any = {
            chat: chat._id,
        }

        if (before) {
            query.createdAt = { $lt: new Date(before) }
        }

        const messages = await ActivityChatMessage.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('sender', 'name avatar')

        res.status(200).json({
            success: true,
            chat,
            count: messages.length,
            messages: messages.reverse(),
        })
    } catch (error) {
        console.error('Get chat messages error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching chat messages',
        })
    }
}

// @desc    Send message to activity chat
// @route   POST /api/chats/activity/:activityId/messages
// @access  Private
export const sendActivityChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { activityId } = req.params
        const { content, messageType = 'text', fileUrl, fileName, fileSize, duration } = req.body

        // Validate based on message type
        if (messageType === 'text' && (!content || !content.trim())) {
            res.status(400).json({
                success: false,
                message: 'Message content is required for text messages',
            })
            return
        }

        if ((messageType === 'voice' || messageType === 'image') && !fileUrl) {
            res.status(400).json({
                success: false,
                message: 'File URL is required for voice and image messages',
            })
            return
        }

        const chat = await ensureActivityChat(activityId)
        if (!chat) {
            res.status(404).json({
                success: false,
                message: 'Chat not found for this activity',
            })
            return
        }

        const isParticipant = chat.participants.some((participant) => participant.toString() === req.userId)
        if (!isParticipant) {
            res.status(403).json({
                success: false,
                message: 'You are not a participant of this activity chat',
            })
            return
        }

        const messageData: any = {
            chat: chat._id,
            activity: chat.activity,
            sender: req.userId,
            messageType,
        }

        if (messageType === 'text') {
            messageData.content = content.trim()
        } else {
            messageData.fileUrl = fileUrl
            messageData.fileName = fileName
            messageData.fileSize = fileSize
            if (messageType === 'voice' && duration) {
                messageData.duration = duration
            }
        }

        const message = await ActivityChatMessage.create(messageData)

        // Update last message in chat
        chat.lastMessage = {
            sender: req.userId as any,
            content: messageType === 'text' ? content.trim() : messageType === 'voice' ? '🎤 Voice message' : '📷 Image',
            createdAt: message.createdAt,
        }
        await chat.save()

        const populatedMessage = await ActivityChatMessage.findById(message._id)
            .populate('sender', 'name avatar')

        const io = getSocketServer()
        if (io && populatedMessage) {
            io.to(activityChatRoomName(chat._id.toString())).emit('activity:message:new', {
                chatId: chat._id.toString(),
                activityId: chat.activity.toString(),
                message: populatedMessage,
            })
        }

        res.status(201).json({
            success: true,
            message: populatedMessage,
        })
    } catch (error) {
        console.error('Send chat message error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while sending message',
        })
    }
}

// @desc    Upload chat file (voice note or image)
// @route   POST /api/chats/upload
// @access  Private
export const uploadChatFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: 'No file uploaded',
            })
            return
        }

        const fileUrl = `/uploads/chat-files/${req.file.filename}`
        const fileName = req.file.originalname
        const fileSize = req.file.size
        const messageType = req.file.mimetype.startsWith('audio/') ? 'voice' : 'image'

        res.status(200).json({
            success: true,
            fileUrl,
            fileName,
            fileSize,
            messageType,
        })
    } catch (error) {
        console.error('Upload chat file error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while uploading file',
        })
    }
}
