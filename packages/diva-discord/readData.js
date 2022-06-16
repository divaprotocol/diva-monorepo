const Enmap = require('enmap')
const fs = require('fs')

// create database
// mapping from discordId => {address, lastClaim, nbrClaims}
const dbRegisteredUsers = new Enmap(
    {
        name: "registeredUsers"
    }
)

var regUsers = [];
var counter = 0

dbRegisteredUsers.forEach((map) => {
    // stringify JSON Object
    regUsers.push(map);
    counter= counter+1
});


fs.writeFile("output.json", JSON.stringify(regUsers), 'utf8', function (err) {
    console.log("Number of users: ");
    console.log(counter)    
    console.log("JSON file has been saved.");
    });