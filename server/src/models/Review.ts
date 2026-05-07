import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
    activity: mongoose.Types.ObjectId
    reviewer: mongoose.Types.ObjectId
    reviewee: mongoose.Types.ObjectId
    rating: number
    feedback: string
    createdAt: Date
    updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
    {
        activity: {
            type: Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
        },
        reviewer: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reviewee: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: 500,
        }
    },
    {
        timestamps: true,
    }
)

reviewSchema.index({ activity: 1, reviewer: 1, reviewee: 1 }, { unique: true })

export default mongoose.model<IReview>('Review', reviewSchema)
