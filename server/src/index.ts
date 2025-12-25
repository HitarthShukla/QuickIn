import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import { initializeSocket } from './socket/index.js'

// Initialize Express
const app = express()
const httpServer = createServer(app)

// Connect to MongoDB
connectDB()

// Initialize Socket.IO
const io = initializeSocket(httpServer)

// Make io accessible to routes if needed
app.set('io', io)

// Middleware
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}))
app.use(morgan('dev'))
// Increase body size limit for base64 image uploads
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'QuickIn API is running',
        timestamp: new Date().toISOString(),
    })
})

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Server error:', err)
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    })
})

// Start server
const PORT = process.env.PORT || 5000

httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 QuickIn Server Started Successfully!         ║
║                                                   ║
║   📡 API:     http://localhost:${PORT}              ║
║   🔌 Socket:  ws://localhost:${PORT}                ║
║   📊 Health:  http://localhost:${PORT}/api/health   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `)
})

export { app, io }
