import { io, type Socket } from 'socket.io-client'

class SocketService {
    private socket: Socket | null = null

    connect(): Socket | null {
        const token = localStorage.getItem('token')

        if (!token) {
            return null
        }

        if (this.socket) {
            this.socket.auth = { token }

            if (!this.socket.connected) {
                this.socket.connect()
            }

            return this.socket
        }

        this.socket = io('/', {
            auth: { token },
            transports: ['websocket', 'polling'],
        })

        return this.socket
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
    }

    on(event: string, callback: (...args: any[]) => void): void {
        const socket = this.connect()
        socket?.on(event, callback)
    }

    off(event: string, callback?: (...args: any[]) => void): void {
        if (!this.socket) {
            return
        }

        if (callback) {
            this.socket.off(event, callback)
            return
        }

        this.socket.off(event)
    }

    emit(event: string, payload?: any): void {
        const socket = this.connect()
        socket?.emit(event, payload)
    }
}

export default new SocketService()
