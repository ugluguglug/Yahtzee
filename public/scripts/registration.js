const Registration = (function() {
    // This function sends a register request to the server
    // * `username`  - The username for the sign-in
    // * `avatar`    - The avatar of the user
    // * `name`      - The name of the user
    // * `password`  - The password of the user
    // * `onSuccess` - This is a callback function to be called when the
    //                 request is successful in this form `onSuccess()`
    // * `onError`   - This is a callback function to be called when the
    //                 request fails in this form `onError(error)`
    const register = function(username, password, onSuccess, onError) {

        //
        // A. Preparing the user data
        //
        let data = {"username": username, "password": password};
 
        //
        // B. Sending the AJAX request to the server
        //
        fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),})
            .then((res) => res.json())
            .then((json) => {
                //
                // F. Processing any error returned by the server
                //
                if (json.status == "success") {
                    document.getElementById("signin-username").value = username;
                    document.getElementById("signin-password").value = password;
                    document.getElementById("signin-form").scrollIntoView();
                    onSuccess();

                }
                //
                // J. Handling the success response from the server
                //
                else if (onError) onError(json.error);
            })
            .catch((err) => onError(err));
        
        

        
 
    };

    return { register };
})();
