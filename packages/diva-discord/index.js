const Config = require('./config.json')
const { ethers } = require('hardhat')

const Enmap = require('enmap')

const Discord = require('discord.js')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, 
                                            Discord.Intents.FLAGS.GUILD_MESSAGES,
                                            Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
                                        ]});

const fs = require('fs')

// set ethers sender account

const { Signer } = require('ethers');

senderAccount = new ethers.Wallet(Config.PRIVATE_KEY, ethers.provider)

// create database
// mapping from discordId => {address, lastClaim, nbrClaims}
const dbRegisteredUsers = new Enmap(
    {
        name: "registeredUsers"
    }
)

client.commands = new Discord.Collection()

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
}

client.login(Config.TOKEN)
//const channelId = "957700678254493776"


client.on("ready", () => {

    console.log(`Logged in as ${client.user.tag}!`)
    //set guild to DIVA server
    const guildId = '928050978714976326'
    const guild = client.guilds.cache.get(guildId)

    //create commands
    let commands = guild.commands

    commands?.create({
        name: 'address',
        description: 'Shows your registered wallet address',
    })

    commands?.create({
        name: 'register',
        description: 'Register your wallet and receive testnet tokens',
        options: [ 
            {
                name: 'address',
                description: 'The ethereum wallet address that you want to register.',
                require: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    })

    commands?.create({
        name: 'changeaddress',
        description: 'Change the address of your registered wallet',
        options: [ 
            {
                name: 'address',
                description: 'The ethereum wallet address that you want to register.',
                require: true,
                type: Discord.Constants.ApplicationCommandOptionTypes.STRING
            }
        ]
    })

    commands?.create({
        name: 'claimtokens',
        description: 'Request additional testnet collateral tokens',
    })
    
})

client.on('interactionCreate', async(interaction) =>{
    try{
        //react to interactions if they are created commands
        if(!interaction.isCommand()) {
            return
        } else {
            //call function from the commands folder with the given commandName
            console.log(interaction.member.roles)
            //check if user has the needed role
            if (interaction.member.roles.cache.some(r => r.name === "Team")){
                if (["address", "changeaddress"].includes(interaction.commandName)) {
                    client.commands.get(interaction.commandName).execute(interaction,
                        dbRegisteredUsers);
                }
                else if (["register", "claimtokens"].includes(interaction.commandName)) {
                    console.log(Config.DUSD_CONTRACT)
                    client.commands.get(interaction.commandName).execute(
                        interaction,
                        dbRegisteredUsers,
                        Config.DUSD_CONTRACT,
                        senderAccount);
                }
            } else {
                interaction.reply({
                    content:  `Sorry, you don't have the needed permissions`,
                    ephemeral: true,
                })
            }
        }
    } 
    catch(e){
        console.log(e)
    }
})