import mongoose, { Schema, Document } from 'mongoose'

export type ActivityType = 'sport' | 'movie' | 'gaming' | 'study' | 'food' | 'event' | 'hangout' | 'other'
export type ActivityStatus = 'open' | 'in-progress' | 'completed' | 'cancelled'
export type JoinType = 'open' | 'request'

export interface IActivity extends Document {
    _id: mongoose.Types.ObjectId
    creator: mongoose.Types.ObjectId
    title: string
    description: string
    type: ActivityType
    status: ActivityStatus
    joinType: JoinType
    location: {
        type: 'Point'
        coordinates: [number, number] // [longitude, latitude]
        address?: string
        placeName?: string
    }
    dateTime: Date
    duration?: number // in minutes
    maxParticipants: number
    participants: mongoose.Types.ObjectId[]
    interests?: string[]
    requirements?: string
    image?: string
    createdAt: Date
    updatedAt: Date
}

const activitySchema = new Schema<IActivity>(
    {
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        type: {
            type: String,
            enum: ['sport', 'movie', 'gaming', 'study', 'food', 'event', 'hangout', 'other'],
            required: [true, 'Activity type is required'],
        },
        status: {
            type: String,
            enum: ['open', 'in-progress', 'completed', 'cancelled'],
            default: 'open',
        },
        joinType: {
            type: String,
            enum: ['open', 'request'],
            default: 'open',
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: function(value: number[]) {
                        return value.length === 2 && 
                               value[0] >= -180 && value[0] <= 180 && // longitude
                               value[1] >= -90 && value[1] <= 90 // latitude
                    },
                    message: 'Invalid coordinates'
                }
            },
            address: {
                type: String,
                trim: true,
            },
            placeName: {
                type: String,
                trim: true,
            }
        },
        dateTime: {
            type: Date,
            required: [true, 'Date and time is required'],
            validate: {
                validator: function(value: Date) {
                    return value > new Date()
                },
                message: 'Activity date must be in the future'
            }
        },
        duration: {
            type: Number,
            min: [15, 'Duration must be at least 15 minutes'],
            max: [1440, 'Duration cannot exceed 24 hours'],
        },
        maxParticipants: {
            type: Number,
            required: [true, 'Max participants is required'],
            min: [2, 'Must allow at least 2 participants'],
            max: [100, 'Cannot exceed 100 participants'],
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        interests: [{
            type: String,
            trim: true,
        }],
        requirements: {
            type: String,
            trim: true,
            maxlength: [200, 'Requirements cannot exceed 200 characters'],
        },
        image: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
)

// Create geospatial index for location-based queries
activitySchema.index({ location: '2dsphere' })

// Index for status and dateTime queries
activitySchema.index({ status: 1, dateTime: 1 })
activitySchema.index({ type: 1, status: 1 })

const Activity = mongoose.model<IActivity>('Activity', activitySchema)

export default Activity
