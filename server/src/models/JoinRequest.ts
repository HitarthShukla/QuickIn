import mongoose, { Schema, Document } from 'mongoose'

export type RequestStatus = 'pending' | 'accepted' | 'rejected'

export interface IJoinRequest extends Document {
    _id: mongoose.Types.ObjectId
    activity: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    message?: string
    status: RequestStatus
    createdAt: Date
    updatedAt: Date
}

const joinRequestSchema = new Schema<IJoinRequest>(
    {
        activity: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            trim: true,
            maxlength: [200, 'Message cannot exceed 200 characters'],
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
)

// Index for efficient queries
joinRequestSchema.index({ activity: 1, status: 1 })
joinRequestSchema.index({ user: 1, activity: 1 }, { unique: true })

const JoinRequest = mongoose.model<IJoinRequest>('JoinRequest', joinRequestSchema)

export default JoinRequest
