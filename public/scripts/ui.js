const FrontPage = (function() {
    // This function initializes the UI
    const initialize = function() {

        // Submit event for the signin form
        $("#signin-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#signin-username").val().trim();
            const password = $("#signin-password").val().trim();

            // Send a signin request
            Authentication.signin(username, password,
                () => {
                    hide();
                    GamePage.update(Authentication.getUser());
                    GamePage.show();
                    Socket.connect();
                },
                (error) => { $("#signin-message").text(error); }
            );
        });

        // Submit event for the register form
        $("#register-form").on("submit", (e) => {
            // Do not submit the form
            e.preventDefault();

            // Get the input fields
            const username = $("#register-username").val().trim();
            const password = $("#register-password").val().trim();
            const confirmPassword = $("#register-confirm").val().trim();

            // Password and confirmation does not match
            if (password != confirmPassword) {
                $("#register-message").text("Passwords do not match.");
                return;
            }

            // Send a register request
            Registration.register(username, password,
                () => {
                    $("#register-form").get(0).reset();
                    $("#register-message").text("You can sign in now.");
                },
                (error) => { $("#register-message").text(error); }
            );
        });
    };

    // This function shows the form
    const show = function() {
        $("#front-page").show();                                          ///////////////show
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#front-page").hide();
    };

    return { initialize, show, hide };
})();

const GamePage = (function() {
    // This function initializes the UI

    const gameScreen = document.getElementById('gameScreen');
    const initialScreen = document.getElementById('initialScreen');
    const newGameBtn = document.getElementById('newGameButton');
    const joinGameBtn = document.getElementById('joinGameButton');
    const gameCodeInput = document.getElementById('gameCodeInput');
    const gameCodeDisplay = document.getElementById('gameCodeDisplay');
    const gameStartingCountdown = document.getElementById('gameStarting-countdown');
    const opponentNameDisplay = document.getElementById('opponentName');

    const rematchBtn = document.getElementById('rematch-button');
    const quitBtn = document.getElementById('leave-button');

    newGameBtn.addEventListener('click', newGame);
    joinGameBtn.addEventListener('click', joinGame);
    rematchBtn.addEventListener('click', sendRematch);
    quitBtn.addEventListener('click', quit);

    let gameActive = false;
    let playerNumber;
    let opponentName;
    let rematchStatus = 0; 

    //Request new room 
    function newGame(){
        Socket.createRoom();
        $("#initialScreen").hide();
        $("#createNewGame").show();
        playerNumber = 1;
    }
    //Request join game
    function joinGame(){
        Socket.joinRoom(gameCodeInput.value);
        console.log(gameCodeInput.value);
        playerNumber = 2;
        gameCodeInput.value = ""
    }
    //Send Dice roll result to opponent
    function sendDiceRoll(dice, selDice){
        let data = {
            Dice: dice,
            SelDice: selDice,
            opponent: opponentName
        }
        Socket.sendDice(data);
        console.log("Send Dice ", data)
    }
    
    function sendScore(score){
        let data = {
            Score: score,
            opponent: opponentName
        }
        Socket.sendScore(data);
        console.log("Send Score ", data)
    }

    function gameover(){
        let score = Game.getTotalScore();
        Socket.gameover(score);
        document.getElementById("opponent-username").innerHTML = opponentName;
        $("#game-page").hide();
        $("#gameover-page").show();

    }
    function sendRematch(){
        rematchStatus++;
        console.log("Client sent rematch ",rematchStatus);
        if(rematchStatus <= 2){
            Socket.rematch();
            document.getElementById("gameover-text").innerHTML = "Rematch request sent!";
            if(rematchStatus ==2){
                //rematch confirm, start reset and initialize game
                initRematch();
            }
        }        
    }
    function backToMain(){
        $("#gameover-page").hide();
        $("#initialScreen").show();
    }
    function quit(){
        console.log("Client sent quit ");
        Socket.quit();
        $("#gameover-page").hide();
        $("#initialScreen").show();
    }
    
    //Start the game when the 2nd player joined the room
    function handleInit(opponent){      
        $("#initialScreen").hide();
        $("#createNewGame").hide();
        $("#gameStarting").show();
        opponentName = opponent;
        opponentNameDisplay.innerText = opponentName;
        let timeleft = 1;

        function countdown(){
            timeleft = timeleft -1;
            if(timeleft >0){
                gameStartingCountdown.innerText = timeleft;
                setTimeout(countdown, 1000);
            }else{
                gameStartingCountdown.innerText = "Start";
                startGame();
            }
        }
        setTimeout(countdown, 1000);
        //game start here
        function startGame(){
            console.log("Game Start!");
            Game.init(playerNumber);
            $("#gameStarting").hide();
            $("#game-page").show();
        }
    }
    function handleOpponentDice(diceData){
        let Dice = diceData.Dice;
        let SelDice = diceData.SelDice;
        Game.opponentDice(Dice,SelDice);
        console.log("receive opponent dice");
        console.log(diceData);
    }
    function handleOpponentScore(scoreData){
        let Score = scoreData.Score;
        Game.opponentScore(Score);
        console.log("receive opponent score");
        console.log("opponent score", Score);
    }

    function handleGameCode(gameCode){
        console.log("GameID received "+gameCode);
        gameCodeDisplay.innerText = gameCode;
    }
    function handleUnknownCode(){
        gameCodeInput.value = "";
        alert('Unknown Game Code');
    }
    function handleTooManyPlayers(){
        gameCodeInput.value = "";
        alert('This game is already in progress');
    }
    function handleRematch(){
        
        rematchStatus++;
        console.log("Client receive rematch ", rematchStatus);
        if(rematchStatus == 2){
            initRematch();
        }else{
            document.getElementById("gameover-text").innerHTML = "Your opponent wants to rematch!";
        }
    }
    function initRematch(){
        $("#gameover-page").hide();
        $("#gameStarting").show();
        opponentNameDisplay.innerText = opponentName;
        rematchStatus = 0;
        let timeleft = 1;

        function countdown(){
            timeleft = timeleft -1;
            if(timeleft >0){
                gameStartingCountdown.innerText = timeleft;
                setTimeout(countdown, 1000);
            }else{
                gameStartingCountdown.innerText = "Start";
                startRematch();
            }
        }
        setTimeout(countdown, 1000);
        //game start here
        function startRematch(){
            console.log("Game Start!");
            Game.newGame(playerNumber);
            $("#gameStarting").hide();
            $("#game-page").show();
        }
        //Game.reset();
    }
    function handleOwnerQuit(){
        document.getElementById("gameover-text").innerHTML = "Your opponent has left the match :(";
        rematchBtn.disabled = true;
        setTimeout(quit, 2000);

    }
    function handleGuestQuit(){
        document.getElementById("gameover-text").innerHTML = "Your opponent has left the match :(";
        rematchBtn.disabled = true;
        setTimeout(quit, 2000);
    }
    function handleHighscores(highscores){
        //write scoreboard

    }

    const initialize = function() {

        // Hide it
        $("#pairup-page").hide();
        
        // Click event for the signout button
        $("#signout-button").on("click", () => {
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();
                    hide();
                    FrontPage.show();
                }
            );
        });
    };

    // This function shows the form with the user
    const show = function(user) {
        $("#pairup-page").show();
    };

    // This function hides the form
    const hide = function() {
        $("#pairup-page").hide();
    };

    // This function updates the user panel
    const update = function(user) {
        if (user) {
            $("#pairup-page .username-text").text(user.username);
        }
        else {
            $("#pairup-page .username-text").text("");
        }
    };

    return { initialize, handleInit, sendDiceRoll, sendScore, handleOpponentDice, 
        handleOpponentScore, handleGameCode, handleUnknownCode, 
        handleTooManyPlayers, show, hide, update,
        gameover, handleRematch, handleOwnerQuit, handleGuestQuit, handleHighscores
     };
})();


const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        console.log("running getUserDisplay");
        /*
        return $("<div id='pairup-page-username' class='pairup-page-username'></div>")
            .append($("<h2 class='username-text'>" + hi + "</h2>"));
        */
    };

    // The components of the UI are put here
    const components = [FrontPage, GamePage];

    // This function initializes the UI
    const initialize = function() {
        // Initialize the components
        for (const component of components) {
            component.initialize();
        }
    };

    return { getUserDisplay, initialize};
})();
