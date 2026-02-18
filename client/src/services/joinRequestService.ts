import api from './api'
import type {
    SendJoinRequestPayload,
    JoinRequestResponse,
    JoinRequestsResponse,
    ActivityResponse,
} from '@/types'

class JoinRequestService {
    async sendJoinRequest(activityId: string, payload: SendJoinRequestPayload) {
        return api.post<JoinRequestResponse>(`/activities/${activityId}/join-request`, payload)
    }

    async getJoinRequests(activityId: string) {
        return api.get<JoinRequestsResponse>(`/activities/${activityId}/join-requests`)
    }

    async acceptJoinRequest(activityId: string, requestId: string) {
        return api.put<ActivityResponse>(`/activities/${activityId}/join-requests/${requestId}/accept`)
    }

    async rejectJoinRequest(activityId: string, requestId: string) {
        return api.put<JoinRequestResponse>(`/activities/${activityId}/join-requests/${requestId}/reject`)
    }

    async removeParticipant(activityId: string, participantId: string) {
        return api.delete<JoinRequestResponse>(`/activities/${activityId}/participants/${participantId}`)
    }
}

export default new JoinRequestService()
