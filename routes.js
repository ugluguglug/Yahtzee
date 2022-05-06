const express = require("express")
const router = express.Router()

const bcrypt = require("bcrypt");
const fs = require("fs");

function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

router.post("/register", (req, res) => {
    // Get the JSON data from the body
    const { username, password } = req.body;

    console.log(username, password);

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("./database/users.json"));

    // E. Checking for the user data correctness
    if (username === "" || password === "") {
        res.json({ status: "error", error: "Username/email/password cannot be empty!" });
    }
    else if (!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "The username should contain only underscores, letters or numbers!" });
    }
    else if (username in users) {
        res.json({ status: "error", error: "Username has already been used!" });
    }
    else {
        // G. Adding the new user account
        const hash = bcrypt.hashSync(password, 10);
        users[username] = { password: hash, highscore: 0 };

        // H. Saving the users.json file
        fs.writeFileSync("./database/users.json", JSON.stringify(users, null, " "));

        // I. Sending a success response to the browser
        res.json({ status: "success" });
    }
});

module.exports = router