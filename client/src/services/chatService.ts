import api from './api'
import type {
    ActivityChatsResponse,
    ActivityChatMessagesResponse,
    ActivityChatSendMessageResponse,
    UploadChatFileResponse,
} from '@/types'

class ChatService {
    async getMyActivityChats() {
        return api.get<ActivityChatsResponse>('/chats/activity')
    }

    async getActivityChatMessages(activityId: string, params?: { limit?: number; before?: string }) {
        return api.get<ActivityChatMessagesResponse>(`/chats/activity/${activityId}/messages`, {
            params,
        })
    }

    async sendActivityChatMessage(
        activityId: string,
        data: {
            content?: string
            messageType?: 'text' | 'voice' | 'image'
            fileUrl?: string
            fileName?: string
            fileSize?: number
            duration?: number
        }
    ) {
        return api.post<ActivityChatSendMessageResponse>(`/chats/activity/${activityId}/messages`, data)
    }

    async uploadChatFile(file: File) {
        const formData = new FormData()
        formData.append('file', file)

        return api.post<UploadChatFileResponse>('/chats/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    }
}

export default new ChatService()
