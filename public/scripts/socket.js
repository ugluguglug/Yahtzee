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
        socket.on('start game', handleInit);
        socket.on('opponent dice', handleOpponentDice);
        socket.on('opponent score', handleOpponentScore);
        socket.on('room created', handleGameCode);
        socket.on('no room', handleUnknownCode);
        socket.on('full room', handleTooManyPlayers);

        socket.on('rematch request', handleRematch);
        socket.on('owner quit', handleOwnerQuit);
        socket.on('guest quit', handleGuestQuit);
        socket.on('highscores', handleHighscores);
        socket.on('opponent left', handleOpponentDisconnect);

        function handleInit(opponentName){
            GamePage.handleInit(opponentName);
        }
        function handleGameCode(gameCode){        
            GamePage.handleGameCode(gameCode);
        }
        function handleUnknownCode(){
            GamePage.handleUnknownCode();
        }
        function handleTooManyPlayers(){
            GamePage.handleTooManyPlayers();
        }
        function handleOpponentDice(opponentDiceData){
            GamePage.handleOpponentDice(opponentDiceData);
        }
        function handleOpponentScore(opponentScore){
            GamePage.handleOpponentScore(opponentScore);
        }
        function handleRematch(){
            GamePage.handleRematch();
        }
        function handleOwnerQuit(){
            GamePage.handleOwnerQuit();
        }
        function handleGuestQuit(){
            GamePage.handleGuestQuit();
        }
        function handleHighscores(highscores){
            GamePage.handleHighscores(highscores);
        }
        function handleOpponentDisconnect(){
            GamePage.handleOpponentDisconnect();
        }

    };

    const createRoom = function() {
        socket.emit("create room");
        console.log("Create new room from client");
    };

    const joinRoom = function(roomID) {
        socket.emit("join room", roomID);
        console.log("Join room from client");
    }
    const sendDice = function(data){
        socket.emit("dice roll",data);
        console.log("dice sent by client");
    }
    const sendScore = function(data){
        socket.emit("score", data);
        console.log("score sent by client");
    }
    const gameover = function(score){
        socket.emit("game over", score);
    }
    const rematch = function(){
        socket.emit("rematch");
    }
    const quit = function(){
        socket.emit("quit");
    }
    const getHighscore = function(){
        socket.emit("get highscore");
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

    return { getSocket, connect, createRoom, joinRoom, sendDice, 
        sendScore, gameover, getHighscore, rematch, quit, disconnect};
})();
