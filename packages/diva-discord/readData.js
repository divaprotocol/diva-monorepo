const Enmap = require('enmap')

// create database
// mapping from discordId => {address, lastClaim, nbrClaims}
const dbRegisteredUsers = new Enmap(
    {
        name: "registeredUsers"
    }
)

dbRegisteredUsers.forEach((map) => {
    console.log(map)
  });