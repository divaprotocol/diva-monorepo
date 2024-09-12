const Config = require('./config.json')

const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, 
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_INTEGRATIONS
]});
var fs = require('fs');

async function checkServerMembership(guildId, userId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        return member != null;
    } catch (error) {
        return false;
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
  
async function main() {
    var users = JSON.parse(fs.readFileSync("users.json"));

    const guildId = "928050978714976326"; // replace with your server ID
    let i = 0;
    while (i < users.length) {
        const userId = users[i]; // replace with the user ID you want to check
        
        const isMember = await checkServerMembership(guildId, userId);
        fs.appendFile('ismember.txt', `${userId}; ${isMember}\r\n` , function (err) {    });
        sleep(500)
        console.log(`The user is a member of the server: ${isMember}`);
        i++
    }
}

client.login(Config.TOKEN); // replace with your bot token

client.on("ready", async() => {
    main();
})