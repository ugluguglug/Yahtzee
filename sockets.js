const fs = require('fs');

const onlineUsers = {};
const users = JSON.parse(fs.readFileSync("./database/users.json"));

console.log(users);

exports = module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("Receive connection");
        let user = socket.request.session.user;
        console.log(user);
        if (user) {
            onlineUsers[user.username] = { highscore: users[user.username].highscore };
        }

        // Notify other users that this guy joined
        io.emit("add user", JSON.stringify(user));

        socket.on("users", () => {
            console.log(onlineUsers);
        })

        socket.on("disconnect", () => {
            delete onlineUsers[user.username];
            io.emit("remove user", JSON.stringify(user));
        });

        socket.on("get users", () => {
            socket.emit("users", JSON.stringify(onlineUsers));
        });

        socket.on("get messages", () => {
            console.log("get messages")
        })

        socket.on("post message", (content) => {
            let msg = {
                user: user,
                datetime: new Date(),
                content: content
            };
            const chatroom = JSON.parse(fs.readFileSync("./data/chatroom.json"));
            chatroom.push(msg);
            fs.writeFileSync("./data/chatroom.json", JSON.stringify(chatroom, null, " "));
            io.emit("add message", JSON.stringify(msg));
        })

        socket.on("typing", () => {
            io.emit("typing broadcast", user.name);
        })

    });
}
