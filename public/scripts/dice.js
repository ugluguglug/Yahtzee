const Dice = function(ctx, canvasWidth, canvasHeight, index){
    let value = 1;
    let xPos = canvasWidth/5 * (index-1) + 10;
    let yPos = canvasHeight/2;
    let selected = false;
    let diceWidth = 60;
    let diceHeight = 60;


    const diceImage = new Image();

    // const useImage = function(image){
    //     sheet.src = image;
    //     return this;
    // }

    const drawDice = function() {

        switch(value){
            case 1:
                diceImage.src = "images/1_dot.png";
                break;
            case 2:
                diceImage.src = "images/2_dots.png";
                break;
            case 3:
                diceImage.src = "images/3_dots.png";
                break;
            case 4:
                diceImage.src = "images/4_dots.png";
                break;
            case 5:
                diceImage.src = "images/5_dots.png";
                break;
            case 6:
                diceImage.src = "images/6_dots.png";
                break;    
        }
        
        if(selected==false){
            ctx.drawImage(diceImage, 
                xPos, 
                yPos,
                diceWidth,
                diceHeight,
                );
        }
        
        
        //console.log("drawing");
    };

    const getSelect = function(){
        if (selected == false){
            return 0;
        }
        else return 1;
    }

    const changeY = function(newY){
        yPos = newY;
        return this;
    }

    const getImgSrc = function(){
        return diceImage.src;
    }

    const getX = function(){
        return xPos;
    }

    const getY = function(){
        return yPos;
    }

    const getW = function(){
        return diceWidth;
    }

    const getH = function(){
        return diceHeight;
    }

    const getVal = function(){
        return value;
    };

    const changeVal = function(x){
        value = x;
        return this;
    };

    const rollDice = function(){
        if(selected == false){
            let roll = Math.floor(Math.random()*6)+1;
            value = roll;
            setY(canvasHeight-diceHeight);
        }
        else {
            //console.log("can't roll selected dice");
            return;}
    };

    const resetY = function(){
        yPos = canvasHeight/2;
    }

    const setY = function(yMax){
        let newY = Math.floor(Math.random()*yMax)+1;
        yPos = newY;
    };

    const getIndex = function(){
        return index;
    };

    const clickDice = function(){
        if (selected==false)selected = true;
    };

    const enableDice = function(){
        if(selected==true) selected = false;
    }

    return{
        drawDice: drawDice,
        getVal: getVal,
        changeVal: changeVal,
        rollDice: rollDice,
        setY: setY,
        getIndex: getIndex,
        clickDice: clickDice,
        getX: getX,
        getY: getY,
        getH: getH,
        getW: getW,
        getImgSrc: getImgSrc,
        enableDice: enableDice,
        getSelect: getSelect,
        resetY: resetY,
        changeY: changeY
    };


};

