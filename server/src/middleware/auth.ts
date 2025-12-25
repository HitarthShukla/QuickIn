import { Request, Response, NextFunction } from 'express'
import { verifyToken, type JwtPayload } from '../utils/jwt.js'
import User, { type IUser } from '../models/User.js'

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: IUser
            userId?: string
        }
    }
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token: string | undefined

        // Get token from header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided',
            })
            return
        }

        // Verify token
        let decoded: JwtPayload
        try {
            decoded = verifyToken(token)
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Not authorized, token invalid or expired',
            })
            return
        }

        // Get user from token
        const user = await User.findById(decoded.userId)

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
            })
            return
        }

        req.user = user
        req.userId = decoded.userId
        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error in authentication',
        })
    }
}
