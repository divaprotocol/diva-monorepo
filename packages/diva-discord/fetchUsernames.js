
const Config = require('./config.json')

const fetch = require('node-fetch');

const userId = '312312999534788609'; // Replace this with the Discord ID that you want to retrieve the name for
const authToken = Config.TOKEN; // Replace this with your Discord Bot token

var fs = require('fs');
var users = JSON.parse(fs.readFileSync("users.json"));

let promises = [];

//users = ["893699769376059412","312312999534788609"]

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
  
async function queryUsers(start, end) {
    while (i < end) {
        let response= await fetch(`https://discord.com/api/v10/users/${users[i]}`, {
        headers: {
            Authorization: `Bot ${authToken}`
        }
        })
        sleep(500)
        data = await response.json()
        sleep(500)
        console.log(data);
        const discordName = data.username;
        fs.appendFile('mynewfile1.txt', `${data.id}; ${discordName}\r\n` , function (err) {    });

        /*.then(response => response.json())
        .then(data => {

            
            console.log(data)
            console.log(`Discord name for user ${data.id}: ${discordName}`);
            
        })
        .catch(error => {
            console.error(`Error retrieving Discord name for user : ${error}`);
            fs.appendFile('mynewfile1.txt', `; error\r\n`, function (err) {
    
              });
        });*/
        i++
        console.log(i)
    }
}


let start =0;
let i = start;
console.log(users.length);

//321
queryUsers(start, users.length);
/*sleep(1000)
queryUsers(start+10);
sleep(1000)
queryUsers(start+20);
sleep(1000)
queryUsers(start+30);
*/