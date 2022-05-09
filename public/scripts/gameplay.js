
function RollAllDice(diceList){
    for (let i=0; i<diceList.length; i++){
        diceList[i].rollDice();
        console.log("rolling dice: ", i+1);
        
    }
}


function ClearAllData(){
    //reset die
    for(let i=0; i<dice.length;i++){
        dice[i].changeVal(1);
    }

    //button enable
    for(let i=1; i<14; i++){
        document.getElementById("score"+i).disabled = false;
    }

    //clear scoreboard
    for(let i=1; i<15; i++){
        document.getElementById("uscore"+i).innerHTML = "";
        document.getElementById("oscore"+i).innerHTML = "";
    }

    //clear total
    for(let i=1; i<3; i++){
        document.getElementById("utscore"+i).innerHTML = "";
        document.getElementById("otscore"+i).innerHTML = "";
    }

    //clear selected dice
    ClearSelectedDice();
    
    rollCount=0;
    roundCount=0;

}

function NewRound(dice,selDice,rollCount,roundCount,readyCheck,diceArr){
    //set data to default

    //reset Dice
    for(let i=0; i<5; i++){
        dice[i].changeVal(1);
        dice[i].resetY();
        dice[i].enableDice(); 
    }

    //remove selected dice and their image
    selDice = [];
    for (let i=4; i>=0; i--){
        let currentSD = document.getElementById("sd"+(i+1));
        currentSD.style.backgroundImage = 'none';
    }

    //reset rollCount
    rollCount=0;
    document.getElementById("rollAll").innerHTML = "Roll the dice! ("+(3-rollCount)+"/3)";
    //enable roll button
    document.getElementById("rollAll").disabled = false;

    //increment round count
    roundCount++;

    //reset ready
    readyCheck = false;

    //reset dice result array
    diceArr = [];

    $('.table-button').attr('disabled',true); //disable table button at the beginning
    $('.turn-button').attr('disabled',true); //disable turn button at the beginning

}



function ClearSelectedDice(){
    for(let i=1; i<6; i++){
        document.getElementById("sd"+i).style.background= "";
    }
}

function SelectDice(die,sdielist){
    die.clickDice(); //die selected = true
    let dieInd = die.getIndex();
    let dieVal = die.getVal();
    let dieImg = die.getImgSrc();

    sdielist.push([dieInd, dieVal, dieImg]);//[index, value, imgPath]
    
    //console.log(dieImg);
    document.getElementById("sd"+sdielist.length).style.backgroundImage = "url('"+dieImg+"')";

}

function compCol(a, b) {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
}

function SortSelected(sdielist){
    sdielist.sort(compCol); //sort the list
    //redraw the sorted image
    for(let i=0; i<sdielist.length; i++){
        document.getElementById("sd"+(i+1)).style.backgroundImage = "url('"+sdielist[i][2]+"')";
    }
    //remove out of range background
    for(let i=sdielist.length; i<5; i++){
        document.getElementById("sd"+(i+1)).style.backgroundImage = 'none';
    }
}

function updateCheck(readyCheck, diceArr, selDice, selScore){
    if (readyCheck==true && selDice.length==5){
        for(let i=0; i<5; i++){
            diceArr[i]=selDice[i][1];
        }
        console.log("result array: ", diceArr);
        $('.table-button').attr('disabled',false); //enable buttons
        //disable selected score
        if(selScore){
            for(let i=0; i<selScore.length; i++){
                document.getElementById("score"+(selScore[i]+1)).disabled = true;
            }
        }

        score = checkScore(diceArr);
        console.log(score);
        for(let i=0; i<score.length; i++){
            let keep=0
            if(selScore){
                for(let j=0; j<selScore.length; j++){
                  if (i==selScore[j]){
                    keep = 1;
                    break;
                  }
                }
            if(document.getElementById("uscore"+(i+1)).innerHTML==""){
                console.log("changing score",(i+1));
                document.getElementById("uscore"+(i+1)).innerHTML=score[i];
            }
        }
        }

    }
    if (readyCheck==false && selDice.length<5){
        diceArr = [];
        $('.table-button').attr('disabled',true); //disable buttons
        delSimScore(selScore);
    }
}

function delSimScore(selScore){
    for(let i=0; i<13; i++){
        let keep=0;
        if(selScore.length>0){
            for(let j=0; j<selScore.length; j++){
                if(i==selScore[j]){
                    keep=1;
                }
                if(j==selScore.length-1){
                    if(keep==0){
                        console.log("deleting sim score", i+1)
                        document.getElementById("uscore"+(i+1)).innerHTML="";
                    }
                }       
            }
        }
        else{
            //console.log("deleting score with 0 selScore", i+1)
            document.getElementById("uscore"+(i+1)).innerHTML="";
        }
    }    
}


function checkScore(diceArr){
    let score = new Array(13).fill(0);
    let frequency = new Array(6).fill(0);
    let sum = 0;

    for(let i=0;i<diceArr.length;i++)
	{
		frequency[diceArr[i]-1]++;
		sum+=diceArr[i];
	}

    // aces to sixes
    for(let i=0; i<6; i++){
        score[i] = frequency[i]*(i+1);
    };

    // three of a kind
    for(let i=0;i<frequency.length;i++){
        if(frequency[i]>2){
            score[6]=sum;
        }
    }

    // four of a kind
    for(i=0;i<frequency.length;i++){
        if(frequency[i]>3){
            score[7]=sum;
        }        
    }

    //full house
    for(i=0;i<frequency.length;i++)
    {
        if(frequency[i]==3)
        {			
            for(j=0;j<frequency.length;j++)
            {
                if(frequency[j]==2)
                {		
                    score[8]=25;
                }
            }
        }
    }
    
    //small straight
    for(i=0;i<3;i++)
    {
        if(frequency[i]>=1 && frequency[i+1]>=1 && frequency[i+2]>=1 && frequency[i+3]>=1)
        {
            score[9]=30;
        }
    }
    
    //large straight
    for(i=0;i<2;i++){
        if(frequency[i]==1 && frequency[i+1]==1 && frequency[i+2]==1 && frequency[i+3]==1 && frequency[i+4]==1)
        {
            score[10]=40;
        }
    }

    //yahtzee
    for(i=0;i<frequency.length;i++){
        if(frequency[i]>4)
        {
            score[11]=50;
        }
    }

    score[12]=sum;

    return score;

}
