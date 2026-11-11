const crypto = require('crypto')

const TOKEN_TTL_MS = 60 * 60 * 1000 // sessions live for 1 hour

const users = []
const sessions = new Map() // token -> { userId, expiresAt }
let nextUserId = 1

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${hash}`
}

const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split(':')
    const candidate = crypto.scryptSync(password, salt, 64)
    return crypto.timingSafeEqual(candidate, Buffer.from(hash, 'hex'))
}

const createUser = (username, password, role = 'user') => {
    const user = { id: nextUserId++, username, passwordHash: hashPassword(password), role }
    users.push(user)
    return user
}

const findByUsername = (username) =>
    users.find(u => u.username.toLowerCase() === username.toLowerCase())

const publicUser = ({ id, username, role }) => ({ id, username, role })

const createSession = (userId) => {
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, { userId, expiresAt: Date.now() + TOKEN_TTL_MS })
    return token
}

const getToken = (req) => {
    const match = /^Bearer (\S+)$/.exec(req.header('Authorization') || '')
    return match ? match[1] : null
}

// Middleware: requires a valid, non-expired token
const authenticate = (req, res, next) => {
    const token = getToken(req)
    const session = token && sessions.get(token)

    if (!session || session.expiresAt < Date.now()) {
        if (token) sessions.delete(token)
        return res.status(401).send({ error: "Unauthorized: missing, invalid or expired token" })
    }

    const user = users.find(u => u.id === session.userId)
    if (!user) {
        sessions.delete(token)
        return res.status(401).send({ error: "Unauthorized: missing, invalid or expired token" })
    }

    req.user = user
    req.token = token
    next()
}

// Middleware: requires an authenticated admin
const requireAdmin = [authenticate, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send({ error: "Access denied: admin role required" })
    }
    next()
}]

const dropSessionsOf = (userId) => {
    for (const [token, s] of sessions) {
        if (s.userId === userId) sessions.delete(token)
    }
}

// Creates the demo accounts from environment variables (no credentials in code)
const seedUsers = () => {
    const { ADMIN_USERNAME, ADMIN_PASSWORD, USER_USERNAME, USER_PASSWORD } = process.env
    if (ADMIN_USERNAME && ADMIN_PASSWORD) {
        createUser(ADMIN_USERNAME, ADMIN_PASSWORD, 'admin')
    } else {
        console.warn('ADMIN_USERNAME / ADMIN_PASSWORD are not set: no admin account was created')
    }
    if (USER_USERNAME && USER_PASSWORD) {
        createUser(USER_USERNAME, USER_PASSWORD, 'user')
    }
}

module.exports = {
    users, createUser, findByUsername, publicUser, verifyPassword,
    createSession, sessions, authenticate, requireAdmin, dropSessionsOf, seedUsers
}
