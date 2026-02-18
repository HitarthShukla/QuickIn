import mongoose from 'mongoose'
import ActivityChat from '../models/ActivityChat.js'
import ActivityChatMessage from '../models/ActivityChatMessage.js'
import Activity from '../models/Activity.js'
import { getSocketServer } from '../socket/server.js'

const activityChatRoomName = (chatId: string | mongoose.Types.ObjectId): string => `activity-chat:${chatId.toString()}`

export const ensureActivityChat = async (activityId: string | mongoose.Types.ObjectId) => {
    const activity = await Activity.findById(activityId).select('_id title participants')
    if (!activity) {
        return null
    }

    let chat = await ActivityChat.findOne({ activity: activity._id })

    if (!chat) {
        chat = await ActivityChat.create({
            activity: activity._id,
            title: activity.title,
            participants: activity.participants,
        })
    } else {
        const nextParticipantIds = activity.participants.map((p) => p.toString()).sort()
        const currentParticipantIds = chat.participants.map((p) => p.toString()).sort()

        const isParticipantSyncNeeded = JSON.stringify(nextParticipantIds) !== JSON.stringify(currentParticipantIds)
        const isTitleSyncNeeded = chat.title !== activity.title

        if (isParticipantSyncNeeded || isTitleSyncNeeded) {
            chat.title = activity.title
            chat.participants = activity.participants as any
            await chat.save()
        }
    }

    return chat
}

export const addParticipantToActivityChat = async (
    activityId: string | mongoose.Types.ObjectId,
    userId: string
) => {
    const chat = await ensureActivityChat(activityId)
    if (!chat) {
        return null
    }

    const alreadyParticipant = chat.participants.some((participant) => participant.toString() === userId)
    if (!alreadyParticipant) {
        chat.participants.push(new mongoose.Types.ObjectId(userId) as any)
        await chat.save()
    }

    const io = getSocketServer()
    if (io) {
        const populatedChat = await ActivityChat.findById(chat._id)
            .populate('participants', 'name avatar')
            .populate('activity', 'title status dateTime')

        io.to(`user:${userId}`).emit('activity:chat:added', {
            chat: populatedChat,
        })

        io.to(activityChatRoomName(chat._id)).emit('activity:chat:participant-joined', {
            chatId: chat._id.toString(),
            activityId: chat.activity.toString(),
            userId,
        })
    }

    return chat
}

export const removeParticipantFromActivityChat = async (
    activityId: string | mongoose.Types.ObjectId,
    userId: string
) => {
    const chat = await ActivityChat.findOne({ activity: activityId })
    if (!chat) {
        return null
    }

    const beforeCount = chat.participants.length
    chat.participants = chat.participants.filter((participant) => participant.toString() !== userId) as any

    if (chat.participants.length !== beforeCount) {
        await chat.save()
    }

    const io = getSocketServer()
    if (io) {
        io.to(`user:${userId}`).emit('activity:chat:removed', {
            chatId: chat._id.toString(),
            activityId: chat.activity.toString(),
        })

        io.to(activityChatRoomName(chat._id)).emit('activity:chat:participant-left', {
            chatId: chat._id.toString(),
            activityId: chat.activity.toString(),
            userId,
        })
    }

    return chat
}

export const renameActivityChat = async (
    activityId: string | mongoose.Types.ObjectId,
    title: string
) => {
    const chat = await ActivityChat.findOne({ activity: activityId })
    if (!chat) {
        return null
    }

    if (chat.title !== title) {
        chat.title = title
        await chat.save()

        const io = getSocketServer()
        if (io) {
            io.to(activityChatRoomName(chat._id)).emit('activity:chat:renamed', {
                chatId: chat._id.toString(),
                activityId: chat.activity.toString(),
                title,
            })
        }
    }

    return chat
}

export const deleteActivityChat = async (activityId: string | mongoose.Types.ObjectId) => {
    const chat = await ActivityChat.findOne({ activity: activityId })
    if (!chat) {
        return
    }

    await ActivityChatMessage.deleteMany({ chat: chat._id })
    await ActivityChat.deleteOne({ _id: chat._id })

    const io = getSocketServer()
    if (io) {
        io.to(activityChatRoomName(chat._id)).emit('activity:chat:deleted', {
            chatId: chat._id.toString(),
            activityId: chat.activity.toString(),
        })

        chat.participants.forEach((participantId) => {
            io.to(`user:${participantId.toString()}`).emit('activity:chat:removed', {
                chatId: chat._id.toString(),
                activityId: chat.activity.toString(),
            })
        })
    }
}
