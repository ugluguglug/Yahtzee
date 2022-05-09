const express = require("express")
const router = express.Router()

const bcrypt = require("bcrypt");
const fs = require("fs");

function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

router.post("/register", (req, res) => {
    const { username, password } = req.body;
    console.log(`New user registering${username}, ${password})`);

    // Read from db
    const users = JSON.parse(fs.readFileSync("./database/users.json"));

    // Check post data
    if (username === "" || password === "") {
        res.json({ status: "error", error: "Username/password cannot be empty!" });
    }
    else if (!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "The username should contain only underscores, letters or numbers!" });
    }
    else if (username in users) {
        res.json({ status: "error", error: "Username has already been used!" });
    }
    else {
        const hash = bcrypt.hashSync(password, 10);
        users[username] = { password: hash, highscore: 0 };

        fs.writeFileSync("./database/users.json", JSON.stringify(users, null, " "));

        res.json({ status: "success" });
    }
});

router.post("/signin", (req, res) => {
    const { username, password } = req.body;

    // Read from db
    const db = JSON.parse(fs.readFileSync("./database/users.json"));

    // Check post data
    if (username === "" || password === "") {
        res.json({ status: "error", error: "Username/password cannot be empty!" });
    }
    else if (!(username in db)) {
        res.json({ status: "error", error: "User does not exist!" });
    }
    else if (!bcrypt.compareSync(password, db[username].password)) {
        res.json({ status: "error", error: "Incorrect password!" });
    }
    else {
        // Setup session and return success response
        req.session.user = { username: username };
        res.json({ status: "success", user: { username: username } });
    }
});

router.get("/validate", (req, res) => {

    if (req.session.user) {
        res.json({ status: "success", user: req.session.user });
    }
    else {
        res.json({ status: "error", error: "Not yet logged in!" });
    }
});

// TODO: signout
router.get("/signout", (req, res) => {
    delete req.session.user;
    res.json({ status: "success" });
});

module.exports = router