const express = require("express");

const session = require("express-session");

const { createServer } = require("http");
const { Server } = require("socket.io");

const gameSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(gameSession);

app.use(require('./routes'))

const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    gameSession(socket.request, {}, next);
})

httpServer.listen(8000, () => {
    console.log("Server started");
});
