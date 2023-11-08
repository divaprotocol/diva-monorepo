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
var users = []
var regAddress = []
var counter = 0
var address = {};
var duplicatedAddress = {};

dbRegisteredUsers.forEach((value, map) => {
    // stringify JSON Object
    regUsers.push([map, value]);
    users.push(map)
    if (value["address"] in duplicatedAddress) {
        duplicatedAddress[value["address"]] ++
    }
    else if (value["address"] in address){
        duplicatedAddress[value["address"]] = 2
    } 
    else {
        address[value["address"]] = 1
    }
    counter= counter+1
});
console.log(duplicatedAddress)   


fs.writeFile("output.json", JSON.stringify(regUsers), 'utf8', function (err) {
    console.log("Number of users: ");
    console.log(counter)    
    console.log("output.json has been saved.");
    });

fs.writeFile("users.json", JSON.stringify(users), 'utf8', function (err) {
    console.log("users.json has been saved.");
    });