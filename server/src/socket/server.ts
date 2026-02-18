import type { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export const setSocketServer = (server: SocketIOServer): void => {
    io = server
}

export const getSocketServer = (): SocketIOServer | null => {
    return io
}
