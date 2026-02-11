import api from './api'
import type { 
    Activity, 
    ActivitiesResponse, 
    ActivityResponse,
    CreateActivityPayload 
} from '@/types'

class ActivityService {
    async createActivity(payload: CreateActivityPayload) {
        return api.post<ActivityResponse>('/activities', payload)
    }

    async getActivities(params?: {
        page?: number
        limit?: number
        type?: string
        status?: string
        time?: 'now' | 'today' | 'week' | 'all'
    }) {
        return api.get<ActivitiesResponse>('/activities', { params })
    }

    async getNearbyActivities(longitude: number, latitude: number, radius: number = 10) {
        return api.get<ActivitiesResponse>('/activities/nearby', {
            params: { longitude, latitude, radius }
        })
    }

    async getActivityById(id: string) {
        return api.get<ActivityResponse>(`/activities/${id}`)
    }

    async joinActivity(id: string) {
        return api.post<ActivityResponse>(`/activities/${id}/join`)
    }

    async leaveActivity(id: string) {
        return api.post<ActivityResponse>(`/activities/${id}/leave`)
    }

    async updateActivityStatus(id: string, status: string) {
        return api.patch<ActivityResponse>(`/activities/${id}/status`, { status })
    }

    async updateActivity(id: string, payload: Partial<CreateActivityPayload>) {
        return api.put<ActivityResponse>(`/activities/${id}`, payload)
    }

    async deleteActivity(id: string) {
        return api.delete(`/activities/${id}`)
    }
}

export default new ActivityService()
