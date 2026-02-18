import mongoose, { Schema, Document } from 'mongoose'

export interface IActivityChat extends Document {
    _id: mongoose.Types.ObjectId
    activity: mongoose.Types.ObjectId
    title: string
    participants: mongoose.Types.ObjectId[]
    lastMessage?: {
        sender: mongoose.Types.ObjectId
        content: string
        createdAt: Date
    }
    createdAt: Date
    updatedAt: Date
}

const activityChatSchema = new Schema<IActivityChat>(
    {
        activity: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        lastMessage: {
            sender: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            content: {
                type: String,
                trim: true,
            },
            createdAt: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
    }
)

activityChatSchema.index({ participants: 1 })
activityChatSchema.index({ updatedAt: -1 })

const ActivityChat = mongoose.model<IActivityChat>('ActivityChat', activityChatSchema)

export default ActivityChat
