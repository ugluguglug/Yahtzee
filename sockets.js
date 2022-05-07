const fs = require('fs');

const onlineUsers = {};
const rooms = {};

function randomRoomId(username) {
    let roomId = Math.floor(Math.random() * (65535 - 0 + 1)) + 0;

    // If roomId in use
    if (roomId in rooms) {
        console.log("Crashed roomId")
        return false;
    } else {
        rooms[roomId] = { owner: username, player: 1 };
        console.log(`Room ${roomId} created for user ${username}`)
        return roomId;
    }
}

// function getOwnerByRoomId(rooms, roomId) {
//     for (const room of rooms) {
//         if (room.owner == )
//     }
// }

exports = module.exports = function (io) {
    io.on("connection", (socket) => {
        let user = socket.request.session.user;
        let socketId = socket.id

        // Store online users in memory, with their ip address and socket id
        if (user) {
            user = user.username;
            onlineUsers[user] = { socketId: socketId };
            console.log(`User ${user} Socket ${socketId}`);
        }

        // On create room, message: None, create room give them the number
        socket.on("create room", () => {
            // TODO: Check if user already owns a room

            // Keep trying to find an empty room
            while (true) {
                let roomId = randomRoomId(user);
                if (roomId) {
                    // Emit roomId to owner
                    io.to(socketId).emit("room created", roomId);
                    break;
                }
            }
        })

        // On join room, Message: room number(int), join room and start game
        socket.on("join room", (roomIdInt) => {
            let roomId = roomIdInt.toString();

            let guestName = user;
            let guestId = socketId;

            // check if roomId exists
            if (!(roomId in rooms)) {
                io.to(guestId).emit("no room");
                console.log(`Room ${roomId} not found`);
                return;
            }

            // check if room full
            if (rooms[roomId].player > 1) {
                io.to(guestId).emit("full room");
                console.log(`Room ${roomId} is full`);
                return
            }

            // TODO: check if user is the owner

            // After passing all checks
            let ownerName = rooms[roomId].owner;
            let ownerId = onlineUsers[ownerName].socketId;

            // Increment player count in room
            rooms[roomId].player += 1;

            // Tell room owner to start game
            io.to(ownerId).emit("start game", guestName);
            // Tell room guest to start game
            io.to(guestId).emit("start game", ownerName);

            console.log(`${guestName} joined ${ownerName} @ room ${roomId}`);
        })

        // On dice roll, Message: dices(array), send to partner
        socket.on("dice roll", (data) => {
            // let allDices = data.allDices;
            // let selectedDices = data.selectedDices;

            // Find opponentSocketId from name 
            let opponent = data.opponent;
            opponentSocket = onlineUsers[opponent].socketId

            // emit to opponent
            io.to(opponentSocket).emit("opponent dice", data);

            console.log(`${user} sending dice roll to ${opponent}`);
        })

        // On score updates
        socket.on("score", (data) => {
            // let category = data.category;
            // let score = data.score;

            // Find opponentSocketId from name 
            let opponent = data.opponent;
            opponentSocket = onlineUsers[opponent].socketId

            // emit to opponent
            io.to(opponentSocket).emit("opponent score", data);

            console.log(`${user} sending score to ${opponent}`);
        })

        // On gameover, Message: score
        socket.on("game over", (score) => {
            const users = JSON.parse(fs.readFileSync("./database/users.json"));
            if (users[user] && users[user].highscore < score) {
                users[user].highscore = score;
            }
            fs.writeFileSync("./database/users.json", JSON.stringify(users, null, " "));

            console.log(`Receive gameover from ${user}, score: ${score}`);
        })

        // On get highscore, return sorted object with user name and highscore
        socket.on("get highscore", () => {
            const users = JSON.parse(fs.readFileSync("./database/users.json"));
            for (const key in users) {
                delete users[key].password;
            }
            io.to(socketId).emit("highscores", users);
        })

        socket.on("debug", () => {
            console.log(onlineUsers);
            console.log(rooms);
            // console.log(Object.keys(onlineUsers).length);
            // console.log(Object.keys(rooms).length);
        })

        socket.on("disconnect", () => {
            // Remove from memory
            delete onlineUsers[user];

            // TODO: check if the user was inside a room, if yes, notify opponent
        });

        // Notify other users that this guy joined
        // io.emit("add user", JSON.stringify(user));

        // // On get users, broadcast online users
        // socket.on("get users", () => {
        //     socket.emit("users", JSON.stringify(onlineUsers));
        // });

        // socket.on("post message", (content) => {
        //     let msg = {
        //         user: user,
        //         datetime: new Date(),
        //         content: content
        //     };
        //     const chatroom = JSON.parse(fs.readFileSync("./data/chatroom.json"));
        //     chatroom.push(msg);
        //     fs.writeFileSync("./data/chatroom.json", JSON.stringify(chatroom, null, " "));
        //     io.emit("add message", JSON.stringify(msg));
        // })
    });
}
