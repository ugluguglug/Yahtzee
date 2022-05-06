const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, email, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const db = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // E. Checking for the user data correctness
    //
    if (username === "" || email === "" || password === "") {
        res.json({ status: "error", error: "Username/email/password cannot be empty!"});
    }
    else if (!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "The username should contain only underscores, letters or numbers!"});
    }
    else if (email in db) {
        res.json({status: "error", error: "Email has already been used!"});
    }
    else {
        //
        // G. Adding the new user account
        //
        const hash = bcrypt.hashSync(password, 10);
        db[email] = {username: username, password: hash};

        //
        // H. Saving the users.json file
        //
        fs.writeFileSync("./data/users.json", JSON.stringify(db, null, " "));

        //
        // I. Sending a success response to the browser
        //
        res.json({status: "success"});
    }
});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // Get the JSON data from the body
    const { email, password } = req.body;

    //
    // D. Reading the users.json file
    //
    const db = JSON.parse(fs.readFileSync("./data/users.json"));

    //
    // E. Checking for username/password
    //
    if (email === "" || password === "") {
        res.json({status: "error", error: "Email/password cannot be empty!"});
    }
    else if (!(email in db)) {
        res.json({status: "error", error: "User does not exist!"});
    }
    else if (!bcrypt.compareSync(password, db[email].password)){
        res.json({status: "error", error: "Incorrect password!"});
    }
    else {
        //
        // G. Sending a success response with the user account
        //
        req.session.user = {email: email, username: db[email].username};
        res.json({status: "success", user: {email: email, username: db[email].username}});
    }

    
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    //
    // B. Getting req.session.user
    //
    if (req.session.user) {
        res.json({status: "success", user: req.session.user});
    }
    else {
        res.json({status: "error", error: "Not yet logged in!"});
    }

    //
    // D. Sending a success response with the user account
    //
});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    //
    // Deleting req.session.user
    //
    delete req.session.user;

    //
    // Sending a success response
    //
    res.json({status: "success"});
 
});


//
// ***** Please insert your Lab 6 code here *****
//
const { createServer } = require("http");
const { Server } = require("socket.io");
const { Socket } = require("engine.io");
const httpServer = createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
    chatSession(socket.request, {}, next);
})

const onlineUsers = {};

io.on("connection", (socket) => {
    let user = socket.request.session.user;
    if (user) {
        onlineUsers[user.username] = { avatar: user.avatar, name: user.name};
    }

    io.emit("add user", JSON.stringify(user));


    socket.on("disconnect", () => {
        delete onlineUsers[user.username];
        io.emit("remove user", JSON.stringify(user));
    });

    socket.on("get users", () => {
        socket.emit("users", JSON.stringify(onlineUsers));
    });

    socket.on("get messages", () => {
        const chatroom = fs.readFileSync("./data/chatroom.json", "utf-8");
        socket.emit("messages", chatroom);
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



// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
