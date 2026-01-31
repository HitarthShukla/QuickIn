import { Request, Response } from 'express'
import Post from '../models/Post.js'

export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, image } = req.body

        if (!content && !image) {
            res.status(400).json({
                success: false,
                message: 'Post must contain content or an image',
            })
            return
        }

        const post = await Post.create({
            user: req.userId,
            content,
            image,
        })

        const populatedPost = await Post.findById(post._id).populate('user', 'name avatar')

        res.status(201).json({
            success: true,
            post: populatedPost,
        })
    } catch (error) {
        console.error('Create post error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while creating post',
        })
    }
}

export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 10
        const skip = (page - 1) * limit

        const total = await Post.countDocuments()
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name avatar')
            .populate('comments.user', 'name avatar')

        res.status(200).json({
            success: true,
            count: posts.length,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
            },
            posts,
        })
    } catch (error) {
        console.error('Get posts error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while fetching posts',
        })
    }
}

export const toggleReaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.body
        const post = await Post.findById(req.params.id)

        if (!post) {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            })
            return
        }

        const reactionType = type || 'like'

        // Check if user has already reacted
        const existingReactionIndex = post.reactions.findIndex(
            (r) => r.user.toString() === req.userId
        )

        if (existingReactionIndex > -1) {
            const existingReaction = post.reactions[existingReactionIndex]
            if (existingReaction.type === reactionType) {
                // Same reaction, remove it (toggle off)
                post.reactions.splice(existingReactionIndex, 1)
            } else {
                // Different reaction, update it
                existingReaction.type = reactionType
            }
        } else {
            // New reaction
            post.reactions.push({
                user: req.userId as any,
                type: reactionType
            })
        }

        await post.save()

        res.status(200).json({
            success: true,
            reactions: post.reactions,
        })
    } catch (error) {
        console.error('Reaction error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while toggling reaction',
        })
    }
}

export const addComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content } = req.body

        if (!content) {
            res.status(400).json({
                success: false,
                message: 'Comment content is required',
            })
            return
        }

        const post = await Post.findById(req.params.id)

        if (!post) {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            })
            return
        }

        const newComment = {
            user: req.userId as any,
            content,
            createdAt: new Date(),
        }

        post.comments.push(newComment)

        await post.save()

        // We need to populate the user info for the new comment to return it
        const updatedPost = await Post.findById(req.params.id)
            .populate('comments.user', 'name avatar')

        // Get the last added comment which is the new one
        const addedComment = updatedPost?.comments[updatedPost.comments.length - 1]

        res.status(201).json({
            success: true,
            comments: updatedPost?.comments,
            newComment: addedComment
        })
    } catch (error) {
        console.error('Add comment error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error while adding comment',
        })
    }
}
