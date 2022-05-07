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
        $("#front-page").fadeIn(500);
    };

    // This function hides the form
    const hide = function() {
        $("#signin-form").get(0).reset();
        $("#signin-message").text("");
        $("#register-message").text("");
        $("#front-page").fadeOut(500);
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

    newGameBtn.addEventListener('click', newGame);
    joinGameBtn.addEventListener('click', joinGame);
    

    let gameActive = false;
    let playerNumber;

    //Request new room 
    function newGame(){
        Socket.createRoom();
    }
    //Request join game
    function joinGame(){
        Socket.joinRoom(gameCodeInput);
    }

    //Start the game when the 2nd player joined the room
    function handleInit(number){
        playerNumber = number
        initialScreen.style.display = "none"
        //game start here


    }
    function handleGameState(gameState){

    }
    function handleGameOver(){
        
    }

    function handleGameCode(gameCode){
        gameCodeDisplay.innerText = gameCode;
    }
    function handleUnknownCode(){
        reset();
        alert('Unknown Game Code')
    }
    function handleTooManyPlayers(){
        reset();
        alert('This game is already in progress');
    }

    const initialize = function() {


        // Hide it
        $("#game-page").hide();

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
        $("#game-page").fadeIn(500);
    };

    // This function hides the form
    const hide = function() {
        $("#game-page").fadeOut(500);
    };

    // This function updates the user panel
    const update = function(user) {
        if (user) {
            $("#game-page .game-page-username").text(user.username);
        }
        else {
            $("#game-page .game-page-username").text("");
        }
    };

    return { initialize, handleInit, handleGameState, handleGameOver, handleGameCode, handleUnknownCode, handleTooManyPlayers, show, hide, update };
})();


const UI = (function() {
    // This function gets the user display
    const getUserDisplay = function(user) {
        console.log("running getUserDisplay");
        /*
        return $("<div id='game-page-username' class='game-page-username'></div>")
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

    return { getUserDisplay, initialize };
})();
