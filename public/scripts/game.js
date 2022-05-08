const Game = (function(){
	
      const cv = document.getElementById("rollcv");
      const ctx = cv.getContext("2d");
      const cvWidth = cv.width;
      const cvHeight = cv.height;    

      let dice=[];         //Dice objects <- important
      let selDice=[];      //[[index, value, img source]]
      let rollCount=0;     //roll counter, Max 3 roll
      let roundCount=0;     
      let readyCheck = false;  //whether selDice is fulled
      let diceArr = [];
      let selScore = [];    //selected catalog
      let turnScore = [];   //what score should send, [0]: id. [1]: score innerhtml

      $('.table-button').attr('disabled',true); //disable table button at the beginning
      $('.turn-button').attr('disabled',true); //disable turn button at the beginning
      
      function init(playerNo){
        if (playerNo==1){
          myTurn = true;
          
        }
        else {
          myTurn = false;
          document.getElementById("rollAll").disabled = true;
          document.getElementById("rollAll").innerHTML = "Opponent's turn!";
        }
          
      }

      let myTurn = true; //check myTurn


      for(let i=1; i<6; i++){
          newDice = Dice(ctx,cvWidth,cvHeight,i);
          dice.push(newDice);
          //console.log("cvWidth: ",cvWidth);  
      }

      function ckfirst(callback){
        SortSelected(selDice)
        callback(); 
      }
      function cksecond(){
        updateCheck(readyCheck, diceArr, selDice, selScore);
        GamePage.sendDiceRoll(diceInfo(dice),selDice);
      }

      document.getElementById("rollAll").onclick = function(){
        if(rollCount<3){ //check roll count
            for (let i=0; i<dice.length; i++){
              dice[i].rollDice();
            }
          if(rollCount<2){
            GamePage.sendDiceRoll(diceInfo(dice),selDice);
          }
          if(rollCount==2){ //auto select all dice
              
              for (let i=0; i<dice.length; i++){
                setTimeout(()=>{
                  if (dice[i].getSelect()==0){
                    SelectDice(dice[i],selDice)
                    
                    } 
                  },100);  
                 //SortSelected(selDice)                  
              }             

            document.getElementById("rollAll").disabled = true;
            //check score
            //console.log(selDice.length);
            readyCheck = true;
            setTimeout(function(){
              ckfirst(function(){
                cksecond();
              });
              },100);                              
          }
          rollCount++;
          document.getElementById("rollAll").innerHTML = "Roll the dice! ("+(3-rollCount)+"/3)";
          
          //send Dice
          GamePage.sendDiceRoll(diceInfo(dice),selDice);
          
          }
        }


      function getCursorPosition(canvas, event) {
          const rect = canvas.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          //console.log("x: " + x + " y: " + y)
          return [x,y];
      }

      //click to select dice from rollcv
      const clickCanvas = document.getElementById("rollcv");
      clickCanvas.addEventListener('mousedown', function(e) {
          let x = getCursorPosition(clickCanvas, e)[0];
          let y = getCursorPosition(clickCanvas, e)[1];
          console.log("clicked on canvas")
          console.log(myTurn);
          //check whose turn and roll count
          if(rollCount>0 && myTurn==true){
            console.log("clicked on dice")
            for (let i=0; i<dice.length; i++){
              if (x > dice[i].getX() && x < (dice[i].getX() + dice[i].getW()) && y > dice[i].getY() && y < (dice[i].getY() + dice[i].getH()) && dice[i].getSelect()==0){
                console.log("you clicked on Dice ", dice[i].getIndex());
                SelectDice(dice[i],selDice);
                //console.log(selDice);
                SortSelected(selDice);

                //ready to check score
                if (selDice.length==5){
                  readyCheck = true;
                  updateCheck(readyCheck, diceArr, selDice, selScore);               
                }

                //send selDice
                GamePage.sendDiceRoll(diceInfo(dice),selDice);

              }
            }
          }
      })



      //click on selected dice to deselect 
      for (let i=4; i>=0; i--){
        let currentSD = document.getElementById("sd"+(i+1));
        currentSD.onclick = function(){
          //only trigger in own turn
          if(myTurn==true){
              if(rollCount<3){ //can't deselect when finished 3 roll
                if(selDice[i]!=null){
                  dice[(selDice[i][0]-1)].enableDice(); //selected = false
                  selDice.splice(i,1);                  //remove from list
                  currentSD.style.backgroundImage = 'none'; //remove background
                  SortSelected(selDice);                //sort again after remove
                  GamePage.sendDiceRoll(diceInfo(dice),selDice);        //send dice info to opponent
                    if(selDice.length!=5 && readyCheck == true){
                      readyCheck = false;
                      updateCheck(readyCheck, diceArr, selDice); 
                    }
              }
            }
          }
        }
      }

      //mark aand select score
      for (let i=0; i<13; i++){
        let currentBut = document.getElementById("score"+(i+1));
        currentBut.onclick = function(){
          if(selScore){
            for(let j=0; j<selScore.length; j++){
              if (i==j){
                break;
              }
            }
            selScore.push(i);
            document.getElementById("uscore"+(i+1)).style.color= "red"
            // save this turn selected score info
            turnScore[0] = "oscore"+(i+1) ;
            turnScore[1] = document.getElementById("uscore"+(i+1)).innerHTML;

            console.log(selScore);
            delSimScore(selScore);
          }
          else{
            selScore.push(i);
            document.getElementById("uscore"+(i+1)).style.color= "red"

            // save this turn selected score info
            turnScore[0] = "oscore"+(i+1) ;
            turnScore[1] = document.getElementById("uscore"+(i+1)).innerHTML;

            console.log(selScore);
            delSimScore(selScore);
          }

          $('.table-button').attr('disabled',true);
          $('.turn-button').attr('disabled',false); 
          document.getElementById("rollAll").disabled = true;
        }
      }

      let roundButton = document.getElementById("nextr");
      roundButton.onclick = function (){

          /* 
          finished own turn
          send:
          dice
          selDice
          turnScore
          */

          GamePage.sendDiceRoll(diceInfo(dice),selDice);
          GamePage.sendScore(turnScore)

        //set data to default

        //reset Dice
        for(let i=0; i<5; i++){
            dice[i].changeVal(1);
            dice[i].resetY();
            dice[i].enableDice(); 
        }

        //reset turnScore
        turnScore = [];

        //remove selected dice and their image
        selDice = [];
        for (let i=4; i>=0; i--){
            let currentSD = document.getElementById("sd"+(i+1));
            currentSD.style.backgroundImage = 'none';
        }

        //reset rollCount
        rollCount=0;
        document.getElementById("rollAll").innerHTML = "Opponent's turn!";
        

        //increment round count
        roundCount++;

        //reset ready
        readyCheck = false;

        //reset dice result array
        diceArr = [];

        $('.table-button').attr('disabled',true); //disable table button at the beginning
        $('.turn-button').attr('disabled',true); //disable turn button at the beginning
            
        //selScore should remain unchanged
        console.log("selScore is: ", selScore);
        
        //calculate total score until now
        let uppersum=0;
        let totalsum=0;
        for (let i=0; i<selScore.length; i++){
          let result = parseInt(document.getElementById("uscore"+(selScore[i]+1)).innerHTML)
          if(selScore[i]<6){
            uppersum += result;
          }
          totalsum += result;
        }
        document.getElementById("utscore1").innerHTML=uppersum;
        document.getElementById("utscore3").innerHTML=totalsum;
        if(uppersum>63){
          document.getElementById("utscore2").innerHTML=35;
        }

        if(myTurn==true){
          console.log("myturn = false");
          myTurn=false;
        }
        else{
          myTurn = true;
          //enable roll button
          document.getElementById("rollAll").disabled = false;
        }
        console.log("roundCount: ", roundCount);
        if(roundCount==2){   //26
          document.getElementById("your-score").innerHTML = document.getElementById("utscore3").innerHTML;
          document.getElementById("opponent-score").innerHTML = document.getElementById("otscore3").innerHTML;
          let ut = parseInt(document.getElementById("your-score").innerHTML);
          let ot = parseInt(document.getElementById("opponent-score").innerHTML); 
          if (ut>ot){
            document.getElementById("result-condition").innerHTML = "YOU WIN!"
          }
          else if(ut==ot){
            document.getElementById("result-condition").innerHTML = "DRAW!"
          }
          else if(ut<ot){
            document.getElementById("result-condition").innerHTML = "YOU LOST!"
          }
          console.log("GameOver");
          setTimeout(GamePage.gameover, 1000);
        }

      }

      // function opponentDice(newdice, newselDice){
      //   dice = newdice;
      //   selDice = newselDice;
      //   if(selDice){
      //     for(let i=0; i<selDice.length; i++){
      //       document.getElementById("sd"+(i+1)).style.backgroundImage = "url('"+selDice[i][2]+"')";
      //     }
      //     for(let i=selDice.length; i<5; i++){
      //       document.getElementById("sd"+(i+1)).style.backgroundImage = 'none';
      //     }
      //   }       
      // }

      function diceInfo(dice){
        let info = [[0,0],[0,0],[0,0],[0,0],[0,0]];
        for(let i=0; i<5; i++){
          info[i][0] = dice[i].getVal();
          info[i][1] = dice[i].getY();
        }
        return info;
      }

      function opponentDice(newdice, newselDice){

        for (let i=0; i<5; i++){
          let diceVal = newdice[i][0];
          let diceY = newdice[i][1];

          dice[i].changeVal(diceVal);
          dice[i].changeY(diceY);
        }
        
        selDice = newselDice;
        if(selDice){
          SortSelected(selDice)
          for(let i=0; i<5; i++){
            dice[i].enableDice();
            for(let j=0; j<selDice.length; j++){
              if(i == selDice[j][0]-1){
                dice[i].clickDice();
              }
            }
            
          }
        }         
      }

      function opponentScore(turnScore){
        document.getElementById(turnScore[0]).innerHTML = turnScore[1];
        let uppersum=0;
        let totalsum=0;
        for (let i=0; i<13; i++){
          let result = (document.getElementById("oscore"+(i+1)).innerHTML)
          if(result==""){result = 0};
          result = parseInt(result);
          if(i<6){
            uppersum += result;
          }
          totalsum += result;
        }
        document.getElementById("otscore1").innerHTML=uppersum;
        document.getElementById("otscore3").innerHTML=totalsum;
        if(uppersum>63){
          document.getElementById("otscore2").innerHTML=35;
        }

        for(let i=0; i<5; i++){
          dice[i].changeVal(1);
          dice[i].resetY();
          dice[i].enableDice(); 
      }

        //reset turnScore
        turnScore = [];

        //remove selected dice and their image
        selDice = [];
        for (let i=4; i>=0; i--){
            let currentSD = document.getElementById("sd"+(i+1));
            currentSD.style.backgroundImage = 'none';
        }

        //reset rollCount
        rollCount=0;
        document.getElementById("rollAll").innerHTML = "Roll the dice! ("+(3-rollCount)+"/3)";
        

        //increment round count
        roundCount++;

        //reset ready
        readyCheck = false;

        //reset dice result array
        diceArr = [];

        $('.table-button').attr('disabled',true); //disable table button at the beginning
        $('.turn-button').attr('disabled',true); //disable turn button at the beginning
            
        //selScore should remain unchanged
        console.log("selScore is: ", selScore);   

        myTurn = true;
          //enable roll button
        document.getElementById("rollAll").disabled = false;

        console.log("roundCount: ", roundCount);
        if(roundCount==2){  ////26
          document.getElementById("your-score").innerHTML = document.getElementById("utscore3").innerHTML;
          document.getElementById("opponent-score").innerHTML = document.getElementById("otscore3").innerHTML;
          let ut = parseInt(document.getElementById("your-score").innerHTML);
          let ot = parseInt(document.getElementById("opponent-score").innerHTML); 
          if (ut>ot){
            document.getElementById("result-condition").innerHTML = "YOU WIN!"
          }
          else if(ut==ot){
            document.getElementById("result-condition").innerHTML = "DRAW!"
          }
          else if(ut<ot){
            document.getElementById("result-condition").innerHTML = "YOU LOST!"
          }

          console.log("GameOver");
          setTimeout(GamePage.gameover, 1000);
        }
      }

      function getTotalScore(){
        return parseInt(document.getElementById("utscore3").innerHTML);
      }

      //cheat mode roll
      $(document).on("keydown", function(event) {
        if(event.keyCode == 67 && rollCount>0){
          for (let i=0; i<dice.length; i++){
            dice[i].rollDice();
            GamePage.sendDiceRoll(diceInfo(dice),selDice);
          }
        }
      });

      //clear all data new game
      function newGame(playerNo){

        selDice=[];      //selected Dice, Max 5
        rollCount=0;     //roll counter, Max 3 roll

        roundCount=0; 
        document.getElementById("rollAll").innerHTML = "Roll the dice! ("+(3-rollCount)+"/3)";    
        
        readyCheck = false;  //whether selDice is fulled
        diceArr = [];
        selScore = [];    //[[index, value, img source]]
        turnScore = [];   //what score should send, [0]: id. [1]: score innerhtml

        for(let i=0; i<5;i++){
          dice[i].changeVal(1);
          dice[i].resetY();
          dice[i].enableDice(); 
        }
  
        //clear scoreboard
        for(let i=1; i<14; i++){
            document.getElementById("uscore"+i).innerHTML = "";
            document.getElementById("oscore"+i).innerHTML = "";
        }
    
        //clear total score
        for(let i=1; i<4; i++){
            document.getElementById("utscore"+i).innerHTML = "";
            document.getElementById("otscore"+i).innerHTML = "";
        }

        $('.table-button').attr('disabled',true); //disable table button at the beginning
        $('.turn-button').attr('disabled',true); //disable turn button at the beginning

        ClearSelectedDice() //clear selected dice image

        init(playerNo) //set whose turn and initialize

      }


      //update dice 
      function doFrame(now) {
          ctx.clearRect(0,0,cv.width, cv.height);

          for (die in dice){
              dice[die].drawDice();              
          }
          requestAnimationFrame(doFrame);
      }
      requestAnimationFrame(doFrame);
	

    function globalFunciton(){
		
    }


    return { 
      globalFunciton,
      init,
      opponentDice,
      opponentScore,
      getTotalScore,
      newGame

    };
})();