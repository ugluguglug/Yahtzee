const fs = require('fs');

const onlineUsers = {};
const rooms = {};

function randomRoomId(username) {
    let roomId = Math.floor(Math.random() * (65535 - 0 + 1)) + 0;
    // If roomId in use
    if (roomId in rooms) {
        return false;
    } else {
        rooms[roomId.toString()] = { owner: username };
        console.log(`Room ${roomId} created for ${username}`)
        return true;
    }
}

exports = module.exports = function (io) {
    io.on("connection", (socket) => {
        let user = socket.request.session.user;
        let ip = socket.handshake.address.split(":")[3];
        let id = socket.id

        // Store online users in memory, with their ip address and socket id
        if (user) {
            onlineUsers[user.username] = { ip: ip, id: id };
            console.log(`User ${user.username} from ${ip}`);
        }

        // Notify other users that this guy joined
        io.emit("add user", JSON.stringify(user));

        // On creat room, message: None, create room give them the number
        socket.on("create room", () => {
            // Keep trying to find an empty room
            while (!randomRoomId(user.username));
        })

        // On join room, Message: room number(int), join room and start game
        socket.on("join room", (roomId) => {
            // check if roomId exists

            // if not exist, start game
        })

        // On dice roll, Message: dices(array), send to partner
        socket.on("dice roll", (dices) => {
            // find opponent

            // emit to opponent
        })

        // On gameover, Message: score
        socket.on("score", (score) => {
            console.log(`Receive score of ${score}`)
            const users = JSON.parse(fs.readFileSync("./database/users.json"));
            if (users[user.username] && users[user.username].highscore < score) {
                users[user.username].highscore = score;
            }
            fs.writeFileSync("./database/users.json", JSON.stringify(users, null, " "));
        })

        // On get users, broadcast online users
        socket.on("get users", () => {
            socket.emit("users", JSON.stringify(onlineUsers));
        });

        socket.on("debug", () => {
            console.log(onlineUsers);
            console.log(Object.keys(onlineUsers).length);
            console.log(rooms);
            console.log(Object.keys(rooms).length);
        })

        socket.on("disconnect", () => {
            // Remove from memory
            delete onlineUsers[user.username];
            // Remove from other user's list
            io.emit("remove user", JSON.stringify(user));
        });

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
