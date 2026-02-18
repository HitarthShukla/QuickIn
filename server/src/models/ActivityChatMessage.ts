import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityChatMessage extends Document {
    _id: mongoose.Types.ObjectId
    chat: mongoose.Types.ObjectId
    activity: mongoose.Types.ObjectId
    sender: mongoose.Types.ObjectId
    messageType: 'text' | 'voice' | 'image'
    content?: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    duration?: number
    createdAt: Date
    updatedAt: Date
}

const activityChatMessageSchema = new Schema<IActivityChatMessage>(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: 'ActivityChat',
            required: true,
        },
        activity: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        messageType: {
            type: String,
            enum: ['text', 'voice', 'image'],
            default: 'text',
            required: true,
        },
        content: {
            type: String,
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        fileUrl: {
            type: String,
        },
        fileName: {
            type: String,
        },
        fileSize: {
            type: Number,
        },
        duration: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
)

activityChatMessageSchema.index({ chat: 1, createdAt: -1 })
activityChatMessageSchema.index({ activity: 1, createdAt: -1 })

const ActivityChatMessage = mongoose.model<IActivityChatMessage>('ActivityChatMessage', activityChatMessageSchema)

export default ActivityChatMessage
