const Socket = (function() {
    // This stores the current Socket.IO socket
    let socket = null;

    // This function gets the socket from the module
    const getSocket = function() {
        return socket;
    };

    let typingTimeout = null;

    // This function connects the server and initializes the socket
    const connect = function() {
        socket = io();

        // Wait for the socket to connect successfully
        socket.on("connect", () => {
            // Get the online user list
            socket.emit("get users");

            // Get the chatroom messages
            //socket.emit("get messages");
        });
        socket.on('init', handleInit);
        socket.on('gameState', handleGameState);
        socket.on('gameOver', handleGameOver);
        socket.on('gameCode', handleGameCode);
        socket.on('unknownCode', handleUnknownCode);
        socket.on('tooManyPlayers', handleTooManyPlayers);

        function handleInit(playerNumber){
            Gamepage.handleInit(playerNumber);
        }
        function handleGameState(){
            Gamepage.handleGameState();
        }
        function handleGameOver(){
            Gamepage.handleGameOver();
        }
        function handleGameCode(gameCode){
            Gamepage.handleGameCode(gameCode);
        }
        function handleUnknownCode(){
            Gamepage.handleUnknownCode();
        }
        function handleTooManyPlayers(){
            Gamepage.handleTooManyPlayers();
        }

        /*
        // Set up the users event
        socket.on("users", (onlineUsers) => {
            onlineUsers = JSON.parse(onlineUsers);

            // Show the online users
            OnlineUsersPanel.update(onlineUsers);
        });

        // Set up the add user event
        socket.on("add user", (user) => {
            user = JSON.parse(user);

            // Add the online user
            OnlineUsersPanel.addUser(user);
        });

        // Set up the remove user event
        socket.on("remove user", (user) => {
            user = JSON.parse(user);

            // Remove the online user
            OnlineUsersPanel.removeUser(user);
        });

        // Set up the messages event
        socket.on("messages", (chatroom) => {
            chatroom = JSON.parse(chatroom);

            // Show the chatroom messages
            ChatPanel.update(chatroom);
        });

        // Set up the add message event
        socket.on("add message", (message) => {
            message = JSON.parse(message);

            // Add the message to the chatroom
            ChatPanel.addMessage(message);
        });

        socket.on("typing broadcast", (name) => {
            ChatPanel.updateTyping(name);

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                ChatPanel.clearTyping();
            }, 3000);
        })
        */
    };

    const createRoom = function() {
        socket.emit("create room");
        console.log("Create new room from client");
    };

    const joinRoom = function(roomID) {
        socket.emit("join room", roomID);
        console.log("Join room from client");
    }

    // This function disconnects the socket from the server
    const disconnect = function() {
        socket.disconnect();
        socket = null;
    };

/*    // This function sends a post message event to the server
    const postMessage = function(content) {
        if (socket && socket.connected) {
            socket.emit("post message", content);
        }
    };

    const msgTyping = function() {
        if (socket && socket.connected) {
            socket.emit("typing");
        }
    };
*/

    return { getSocket, connect, createRoom, joinRoom, disconnect};
})();
