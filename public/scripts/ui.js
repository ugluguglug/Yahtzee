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
    const leaveBtn = document.getElementById('leave-button');
    const quitBtn = document.getElementById('quit-button');

    newGameBtn.addEventListener('click', newGame);
    joinGameBtn.addEventListener('click', joinGame);
    rematchBtn.addEventListener('click', sendRematch);
    leaveBtn.addEventListener('click', leave);
    quitBtn.addEventListener('click', quit); 

    let gameActive = false;
    let playerNumber;
    let opponentName;
    let rematchStatus = 0; 
    let click_sound = new Audio('./music/button-click.mp3');
    let match_found_sound = new Audio("./music/league_match_found.mp3");
    let rematch_sound = new Audio("./music/challenger_approaching.mp3");
    let gameover_sound = new Audio("./music/valorant_win.mp3");
    let ingame_sound = new Audio("./music/suwako_theme.mp3");
    let opponent_quit_sound = new Audio("./music/you_died.mp3");


    //Request new room 
    function reset(){
        gameStartingCountdown.innerText = "6";
        rematchStatus = 0;
        document.getElementById("gameover-text").innerHTML = "";
        document.getElementById('rematch-button').disabled = false;

    }
    function newGame(){
        click_sound.play();
        Socket.createRoom();
        $("#initialScreen").hide();
        $("#createNewGame").show();
        playerNumber = 1;
    }
    //Request join game
    function joinGame(){
        click_sound.play();
        Socket.joinRoom(gameCodeInput.value);
        console.log(gameCodeInput.value);
        playerNumber = 2;
        gameCodeInput.value = "";
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
        ingame_sound.animate({volume: 0}, 1000);
        setTimeout(ingame_sound.pause());
        gameover_sound.play();
        let score = Game.getTotalScore();
        Socket.gameover(score);
        Socket.getHighscore();
        document.getElementById("opponent-username").innerHTML = opponentName;
        $("#game-page").hide();
        $("#gameover-page").show();

    }
    function sendRematch(){
        click_sound.play();
        document.getElementById("rematch-button").disabled = true;
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
    function leave(){
        click_sound.play();
        console.log("Client sent leave ");
        Socket.quit();
        $("#gameover-page").hide();
        $("#initialScreen").show();
    }
    function quit(){
        click_sound.play();
        console.log("Client sent quit");
        Socket.quit();
        $("#gameover-page").hide();
        Authentication.signout(
            () => {
                Socket.disconnect();
                hide();
                FrontPage.show();
            }
        );
    }
    
    //Start the game when the 2nd player joined the room
    function handleInit(opponent){      
        $("#initialScreen").hide();
        $("#createNewGame").hide();
        $("#gameStarting").show();
        match_found_sound.play();

        opponentName = opponent;
        opponentNameDisplay.innerText = opponentName;
        let timeleft = 6;

        function countdown(){
            timeleft = timeleft -1;
            if(timeleft >0){
                gameStartingCountdown.innerText = timeleft;
                setTimeout(countdown, 1000);
            }else{
                gameStartingCountdown.innerText = "";
                startGame();
            }
        }
        setTimeout(countdown, 1000);
        //game start here
        function startGame(){
            console.log("Game Start!");
            reset();
            Game.newGame(playerNumber);
            ingame_sound.volume = 0.1;
            ingame_sound.loop = true;
            ingame_sound.currentTime = 0;
            ingame_sound.play();
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
        reset();
        rematch_sound.play();
        opponentNameDisplay.innerText = opponentName;
        let timeleft = 6;

        function countdown(){
            timeleft = timeleft -1;
            if(timeleft >0){
                gameStartingCountdown.innerText = timeleft;
                setTimeout(countdown, 1000);
            }else{
                gameStartingCountdown.innerText = "";
                startRematch();
            }
        }
        setTimeout(countdown, 1000);
        //game start here
        function startRematch(){
            console.log("Game Start!");
            Game.newGame(playerNumber);
            ingame_sound.volume = 0.1;
            ingame_sound.loop = true;
            ingame_sound.currentTime = 0;
            ingame_sound.play();
            $("#gameStarting").hide();
            $("#game-page").show();
        }
        //Game.reset();
    }
    function handleOwnerQuit(){
        document.getElementById("gameover-text").innerHTML = "Your opponent has left the match :(";
        document.getElementById("rematch-button").disabled = true;
        opponent_quit_sound.play();

    }
    function handleGuestQuit(){
        document.getElementById("gameover-text").innerHTML = "Your opponent has left the match :(";
        document.getElementById("rematch-button").disabled = true;
        opponent_quit_sound.play();
    }
    function handleHighscores(highscores){
        //write scoreboard
        console.log("highsocres received: ",highscores);
        if(highscores == null){
            return;
        }
        const object = Object.values(highscores);
        console.log("object: ",object);
        const highScoreArray = object[0];
        console.log("highScoreArray: ",highScoreArray);

        let length = highScoreArray.length;
        console.log("length: ",length);
        if(length > 10){
            length = 10;
        }
        for(let i=0; i<length;i++){
            document.getElementById("username"+(i+1)).innerHTML = highScoreArray[i][0];
            document.getElementById("userscore"+(i+1)).innerHTML = highScoreArray[i][1] ;
        }

    }

    const initialize = function() {

        // Hide it
        $("#pairup-page").hide();
        
        // Click event for the signout button
        $("#signoutButton").on("click", () => {
            click_sound.play();
            // Send a signout request
            Authentication.signout(
                () => {
                    Socket.disconnect();
                    $("#pairup-page").hide();
                    FrontPage.show();
                }
            );
        });
        $("#pairup-page").on("keydown", function(event) {
            if(event.keyCode == 13 ){
                joinGame();
            }
          });
    };

    // This function shows the form with the user
    const show = function(user) {
        $("#pairup-page").show();
        $("#initialScreen").show();
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
