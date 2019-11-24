clicheBingoList = [ 
    "Truck", 
    "Christmas Event", 
    "Misunderstanding", 
    "Brooks Brothers", 
    "Laser eyes(each other)", 
    "Single Mom", 
    "One parent is dead", 
    "Charity Santa", 
    "Interrupted Moment(almost kiss)", 
    "Decorating", 
    "Laser Eyes (him to her)", 
    "Blonde", 
    "Money Trouble", 
    "Car Crash", 
    "Both parents are dead", 
    "Christmas Baking", 
    "Blue Collar Job", 
    "Owns/ Works at Small Independent Shop", 
    "Good with Kids", 
    "Divorced", 
    "Laser Eyes (her to him)", 
    "Tragic Sibling Event", 
    "Reformed Scrooge", 
    "Kissing in Snow", 
    "Class Differences", 
    "Christmas Sweater", 
    "New in Town", 
    "Recycled Advice(“a friend once said..”)", 
    "Illness", 
    "Proposal", 
    "Rugged", 
    "Dog", 
    "Christmas Shopping", 
    "“Moment” by the Christmas Tree", 
    "POC Friend", 
    "Disapproving Parents", 
    "“Oh, It’s Snowing”", 
    "Cat", 
    "Kiss by the Fire", 
    "Single Dad", 
    "Kissing Under Mistletoe"
]





function randomlyPopulateTable(table, rows, columns, values) {

    //duplicate values array so we can mutate it and not mess the real one up
    data = Array.from(values);
    data = shuffle(data);

    for (r=0; r<rows; r++) {
        row = document.createElement("tr");

        for (c = 0; c < columns; c++) {
            value = document.createElement("td");
            value.innerText = data.shift(); //https://stackoverflow.com/a/29606016
            row.appendChild(value)
        }

        table.appendChild(row);
        
    }
}

//Copoed from https://stackoverflow.com/a/2450976 
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

randomlyPopulateTable(document.getElementById("gameboard"), 5,5,clicheBingoList)