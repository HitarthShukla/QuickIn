import mongoose, { Schema, Document } from 'mongoose'

export interface IPost extends Document {
    user: mongoose.Types.ObjectId
    content: string
    image?: string
    reactions: {
        user: mongoose.Types.ObjectId
        type: string
    }[]
    comments: {
        user: mongoose.Types.ObjectId
        content: string
        createdAt: Date
    }[]
    createdAt: Date
    updatedAt: Date
}

const postSchema = new Schema<IPost>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        reactions: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
            type: {
                type: String,
                enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
                default: 'like'
            }
        }],
        comments: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            content: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            }
        }]
    },
    {
        timestamps: true,
    }
)

const Post = mongoose.model<IPost>('Post', postSchema)

export default Post
