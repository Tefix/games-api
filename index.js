require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./docs/swagger.json')
const auth = require('./auth')

const app = express()
const port = process.env.PORT || 8080

app.use(express.json())
const getBaseUrl = (req) => req.protocol + '://' + req.get('host')

const games = [
    { id: 1, name: "Witcher 3", price: 29.99 },
    { id: 2, name: "Cyberpunk 2077", price: 59.99 },
    { id: 3, name: "Minecraft", price: 26.99 },
    { id: 4, name: "Counter-Strike: Global Offensive", price: 0 },
    { id: 5, name: "Roblox", price: 0 },
    { id: 6, name: "Grand Theft Auto V", price: 29.99 },
    { id: 7, name: "Valorant", price: 0 },
    { id: 8, name: "Forza Horizon 5", price: 59.99 }
]

let nextId = Math.max(...games.map(g => g.id)) + 1

// GET /games - public, returns all games
app.get('/games', (req, res) => {
    res.send(games)
})

// GET /games/:id - public, returns full details of a given game
app.get('/games/:id', (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        return res.status(400).send({ error: "Invalid ID format" })
    }

    const game = games.find(g => g.id === id)
    if (!game) {
        return res.status(404).send({ error: "Game not found" })
    }

    res.send(game)
})

// POST /games - any authenticated user can add a game
app.post('/games', auth.authenticate, (req, res) => {
    const { name, price } = req.body || {}

    if (!name || price === undefined || price === null) {
        return res.status(400).send({ error: "One or more required fields are missing" })
    }

    if (typeof name !== 'string' || !name.trim() || typeof price !== 'number' || isNaN(price) || price < 0) {
        return res.status(400).send({ error: "Invalid game parameter values" })
    }

    const gameExists = games.some(g => g.name.toLowerCase() === name.trim().toLowerCase())
    if (gameExists) {
        return res.status(409).send({ error: "Game with the same title already exists" })
    }

    const createdGame = { id: nextId++, name: name.trim(), price }
    games.push(createdGame)

    res.status(201)
        .location(`${getBaseUrl(req)}/games/${createdGame.id}`)
        .send(createdGame)
})

// PUT /games/:id - admin only
app.put('/games/:id', auth.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        return res.status(400).send({ error: "Invalid ID format" })
    }

    const game = games.find(g => g.id === id)
    if (!game) {
        return res.status(404).send({ error: "Game not found" })
    }

    const { name, price } = req.body || {}

    if (!name || price === undefined || price === null) {
        return res.status(400).send({ error: "One or more required fields are missing" })
    }

    if (typeof name !== 'string' || !name.trim() || typeof price !== 'number' || isNaN(price) || price < 0) {
        return res.status(400).send({ error: "Invalid game parameter values" })
    }

    const gameExists = games.some(g => g.id !== id && g.name.toLowerCase() === name.trim().toLowerCase())
    if (gameExists) {
        return res.status(409).send({ error: "Game with the same title already exists" })
    }

    game.name = name.trim()
    game.price = price

    res.send(game)
})

// DELETE /games/:id - admin only
app.delete('/games/:id', auth.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        return res.status(400).send({ error: "Invalid ID format" })
    }

    const index = games.findIndex(g => g.id === id)
    if (index === -1) {
        return res.status(404).send({ error: "Game not found" })
    }

    games.splice(index, 1)
    res.status(204).send()
})

auth.seedAdmin()

const validCredentials = (username, password) =>
    typeof username === 'string' && typeof password === 'string' &&
    /^[A-Za-z0-9_.-]{3,30}$/.test(username.trim()) && password.length >= 8 && password.length <= 100

// POST /auth/register - public sign-up, always creates a regular user
app.post('/auth/register', (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password) {
        return res.status(400).send({ error: "One or more required fields are missing" })
    }
    if (!validCredentials(username, password)) {
        return res.status(400).send({ error: "Invalid username (3-30 letters, digits, _ . -) or password (8-100 characters)" })
    }
    if (auth.findByUsername(username.trim())) {
        return res.status(409).send({ error: "User with the same username already exists" })
    }

    res.status(201).send(auth.publicUser(auth.createUser(username.trim(), password)))
})

// POST /auth/login - returns a bearer token
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body || {}

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).send({ error: "One or more required fields are missing" })
    }

    const user = auth.findByUsername(username.trim())
    if (!user || !auth.verifyPassword(password, user.passwordHash)) {
        return res.status(401).send({ error: "Invalid username or password" })
    }

    res.send({ token: auth.createSession(user.id), user: auth.publicUser(user) })
})

// POST /auth/logout - invalidates the current token
app.post('/auth/logout', auth.authenticate, (req, res) => {
    auth.sessions.delete(req.token)
    res.status(204).send()
})

// GET /users - admin only
app.get('/users', ...auth.requireAdmin, (req, res) => {
    res.send(auth.users.map(auth.publicUser))
})

// PUT /users/:id/role - admin only, changes the role of a user
app.put('/users/:id/role', ...auth.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        return res.status(400).send({ error: "Invalid ID format" })
    }

    const user = auth.users.find(u => u.id === id)
    if (!user) {
        return res.status(404).send({ error: "User not found" })
    }

    const { role } = req.body || {}
    if (role !== 'user' && role !== 'admin') {
        return res.status(400).send({ error: "Role must be 'user' or 'admin'" })
    }
    if (user.id === req.user.id && role !== 'admin') {
        return res.status(400).send({ error: "You cannot remove your own admin role" })
    }

    user.role = role
    res.send(auth.publicUser(user))
})

// DELETE /users/:id - admin only
app.delete('/users/:id', ...auth.requireAdmin, (req, res) => {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
        return res.status(400).send({ error: "Invalid ID format" })
    }

    const index = auth.users.findIndex(u => u.id === id)
    if (index === -1) {
        return res.status(404).send({ error: "User not found" })
    }
    if (id === req.user.id) {
        return res.status(400).send({ error: "You cannot delete your own account" })
    }

    auth.users.splice(index, 1)
    auth.dropSessionsOf(id)
    res.status(204).send()
})

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})
