import api from './api'

export interface CreatePostData {
    content: string
    image?: string
}

export interface Comment {
    _id: string
    user: {
        _id: string
        name: string
        avatar: string
    }
    content: string
    createdAt: string
}

export interface Reaction {
    user: string
    type: string
}

export interface Post {
    _id: string
    user: {
        _id: string
        name: string
        avatar: string
    }
    content: string
    image?: string
    reactions: Reaction[]
    comments: Comment[]
    createdAt: string
    updatedAt: string
}

export default {
    async createPost(data: CreatePostData) {
        return api.post<{ success: boolean; post: Post }>('/posts', data)
    },

    async getPosts(page = 1, limit = 10) {
        return api.get<{ success: boolean; posts: Post[]; pagination: { page: number; pages: number; total: number } }>(`/posts?page=${page}&limit=${limit}`)
    },

    async reactToPost(postId: string, type: string) {
        return api.put<{ success: boolean; reactions: Reaction[] }>(`/posts/${postId}/reaction`, { type })
    },

    async addComment(postId: string, content: string) {
        return api.post<{ success: boolean; comments: Comment[]; newComment: Comment }>(`/posts/${postId}/comments`, { content })
    }
}
