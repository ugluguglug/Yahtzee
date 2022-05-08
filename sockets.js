const fs = require('fs');

// {username: {socketId: sid}}
const onlineUsers = {};
// {roomId: {owner: username, player: 1}}
const rooms = {};

function randomRoomId(username) {
    let roomId = Math.floor(Math.random() * (65535 - 0 + 1)) + 0;

    // If roomId in use
    if (roomId in rooms) {
        console.log("Crashed roomId, generating new roomId")
        return false;
    } else {
        rooms[roomId] = { owner: username, player: 1 };
        console.log(`Room ${roomId} created for user ${username}`)
        return roomId;
    }
}

function getRoomIdByUsername(rooms, user) {
    for (const roomId in rooms) {
        if (rooms[roomId].guest == user || rooms[roomId].owner == user) {
            // console.log(`[getRoomIdByUsername] User ${user} is in Room ${roomId}`);
            return roomId;
        }
    }
    return false;
}

function getOpponent(rooms, user) {
    let roomId = getRoomIdByUsername(rooms, user);
    if (!roomId) {
        // console.log(`[getOpponent] User ${user} is not in any room`);
        return;
    }

    if (rooms[roomId].guest == user) {
        return {
            opponentName: rooms[roomId].owner,
            role: 'guest'
        };
    }
    else if (rooms[roomId].owner == user) {
        return {
            opponentName: rooms[roomId].guest,
            role: 'owner'
        };
    }
    else {
        console.log("[ERROR] Unexpected case in getOpponent");
        return;
    }
}

exports = module.exports = function (io) {
    io.on("connection", (socket) => {
        let user = socket.request.session.user;
        let socketId = socket.id

        // Store online users in memory, with their ip address and socket id
        if (user) {
            user = user.username;
            onlineUsers[user] = { socketId: socketId };
            console.log(`New User, username: ${user} socketId: ${socketId}`);
        }

        // On create room, message: None, create room give them the number
        socket.on("create room", () => {
            // Check if user already owns a room
            if (getRoomIdByUsername(rooms, user)) {
                io.to(socketId).emit("already owns room");
                console.log(`User ${user} already owns a room`);
                return;
            }

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

            // Check if roomId exists
            if (!(roomId in rooms)) {
                io.to(guestId).emit("no room");
                console.log(`Room ${roomId} not found`);
                return;
            }

            // Check if room full
            if (rooms[roomId].player > 1) {
                io.to(guestId).emit("full room");
                console.log(`Room ${roomId} is full`);
                return;
            }

            // Check if owner is joining own room
            if (getRoomIdByUsername(rooms, user)) {
                io.to(guestId).emit("already owns room");
                console.log(`User ${user} already owns a room`);
                return;
            }

            // After passing all checks
            let ownerName = rooms[roomId].owner;
            let ownerId = onlineUsers[ownerName].socketId;

            // Update room condition
            rooms[roomId].player += 1;
            rooms[roomId].guest = user;

            // Tell room owner / guest to start game
            io.to(ownerId).emit("start game", guestName);
            io.to(guestId).emit("start game", ownerName);

            console.log(`${guestName} joined ${ownerName} @ room ${roomId}`);
        })

        // On dice roll, Message: dices(array), send to partner
        socket.on("dice roll", (data) => {
            // Find opponentSocketId from name 
            let opponent = data.opponent;
            opponentSocket = onlineUsers[opponent].socketId

            // emit to opponent
            io.to(opponentSocket).emit("opponent dice", data);

            console.log(`${user} sending dice roll to ${opponent}`);
        })

        // On score updates
        socket.on("score", (data) => {
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

        // On restart
        socket.on("rematch", () => {
            const { opponentName, role } = getOpponent(rooms, user);
            const opponentSocket = onlineUsers[opponentName].socketId

            io.to(opponentSocket).emit("rematch request");
        })

        // On quit
        socket.on("quit", () => {
            const { opponentName, role } = getOpponent(rooms, user);
            const roomId = getRoomIdByUsername(rooms, user);

            // If user quite without room
            if (!roomId) {
                console.log(`[ERROR ]User ${user} emitted quit without a room`);
                return;
            }

            if (role == "owner") {
                console.log(`Deleting room ${roomId} owned by ${user}`);
                delete rooms[roomId];

                // If there is no opponent -> must not be guest
                if (!opponentName) {
                    console.log(`No opponent found`);
                }
                else {
                    console.log(`User ${user} notifying opponent ${opponentName} on quit`);
                    const opponentSocket = onlineUsers[opponentName].socketId
                    io.to(opponentSocket).emit("owner quit");
                }
            }
            else if (role == "guest") {
                console.log(`Guest leaving ${user} from Room ${roomId}`);
                delete rooms[roomId].guest;
                rooms[roomId].player -= 1;

                const opponentSocket = onlineUsers[opponentName].socketId
                io.to(opponentSocket).emit("guest quit");
            }
        })

        // On get highscore, return sorted object with user name and highscore
        socket.on("get highscore", () => {
            const users = JSON.parse(fs.readFileSync("./database/users.json"));
            for (const key in users) {
                delete users[key].password;
            }

            // Sort the scores
            let sortable = [];
            for (const username in users) {
                sortable.push([username, users[username].highscore]);
            }
            sortable.sort((a, b) => {
                return b[1] - a[1];
            })

            // Format and send
            let highscores = { "highscore": sortable };
            io.to(socketId).emit("highscores", highscores);
        })

        socket.on("debug", () => {
            console.log(onlineUsers);
            console.log(rooms);
            // console.log(Object.keys(onlineUsers).length);
            // console.log(Object.keys(rooms).length);
        })

        socket.on("disconnect", () => {
            // Check if the user was inside a room, if yes, notify opponent
            const roomId = getRoomIdByUsername(rooms, user);

            // If user disconnect without room
            if (!roomId) {
                delete onlineUsers[user];
                console.log(`User ${user} disconnected successfully (without room)`);
                return;
            }

            const { opponentName, role } = getOpponent(rooms, user);

            if (!(opponentName || role)) {
                console.log("[ERROR] No opponentName and role returned");
                return;
            }

            if (role == "owner") {
                console.log(`Deleting room ${roomId} owned by ${user}`);
                delete rooms[roomId];
            }
            else if (role == "guest") {
                console.log(`Removing guest ${user} from Room ${roomId}`);
                delete rooms[roomId].guest;
                rooms[roomId].player -= 1;
            }

            if (opponentName) {
                console.log(`User ${user} notifying opponent ${opponentName} on disconnection`);
                const opponentSocket = onlineUsers[opponentName].socketId;
                io.to(opponentSocket).emit("opponent left");
            }

            // Remove from onlineUsers
            delete onlineUsers[user];
            console.log(`Disconnected User ${user} successfully`);
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
