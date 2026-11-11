require('dotenv').config()
const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./docs/swagger.json')

const app = express()
const port = process.env.PORT || 8080

app.use(express.json())
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

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`)
})
