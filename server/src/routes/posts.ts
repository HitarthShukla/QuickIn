import express from 'express'
import { createPost, getPosts, toggleReaction, addComment } from '../controllers/postController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.route('/')
    .post(protect, createPost)
    .get(protect, getPosts)

router.route('/:id/reaction').put(protect, toggleReaction)
router.route('/:id/comments').post(protect, addComment)

export default router
