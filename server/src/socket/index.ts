import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyToken } from '../utils/jwt.js'
import ActivityChat from '../models/ActivityChat.js'

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    })

    // Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token

        if (!token) {
            return next(new Error('Authentication required'))
        }

        try {
            const decoded = verifyToken(token)
            socket.data.userId = decoded.userId
            socket.data.email = decoded.email
            next()
        } catch (error) {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.data.userId}`)

        // Join user to their personal room
        socket.join(`user:${socket.data.userId}`)

        // Join all activity chat rooms for this user
        ActivityChat.find({ participants: socket.data.userId })
            .select('_id')
            .then((chats) => {
                chats.forEach((chat) => {
                    socket.join(`activity-chat:${chat._id.toString()}`)
                })
            })
            .catch((error) => {
                console.error('Failed to join activity chat rooms:', error)
            })

        // Handle joining a room/group
        socket.on('join:room', (roomId: string) => {
            socket.join(`room:${roomId}`)
            console.log(`User ${socket.data.userId} joined room: ${roomId}`)
        })

        // Handle leaving a room/group
        socket.on('leave:room', (roomId: string) => {
            socket.leave(`room:${roomId}`)
            console.log(`User ${socket.data.userId} left room: ${roomId}`)
        })

        // Join activity chat room by activity id
        socket.on('activity:chat:join', async (activityId: string) => {
            try {
                const chat = await ActivityChat.findOne({
                    activity: activityId,
                    participants: socket.data.userId,
                }).select('_id')

                if (chat) {
                    socket.join(`activity-chat:${chat._id.toString()}`)
                }
            } catch (error) {
                console.error('Join activity chat room error:', error)
            }
        })

        // Handle chat messages
        socket.on('chat:message', (data: { roomId: string; message: string }) => {
            io.to(`room:${data.roomId}`).emit('chat:message', {
                userId: socket.data.userId,
                message: data.message,
                timestamp: new Date().toISOString(),
            })
        })

        // Handle typing indicator
        socket.on('chat:typing', (data: { roomId: string; isTyping: boolean }) => {
            socket.to(`room:${data.roomId}`).emit('chat:typing', {
                userId: socket.data.userId,
                isTyping: data.isTyping,
            })
        })

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.data.userId}`)
        })
    })

    return io
}
