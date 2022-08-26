const Config = require('./config.json')
const { ethers } = require('hardhat')

const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseEther } = require('@ethersproject/units')

const Enmap = require('enmap')

const Discord = require('discord.js')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, 
                                            Discord.Intents.FLAGS.GUILD_MESSAGES,
                                            Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
                                        ]});

const fs = require('fs')
// add timestamps in front of log messages
require('console-stamp')(console, '[yyyy/mm/dd HH:MM:ss.l]');

client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {

    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
    console.log(command.name)
    console.log(command)
}

const channelId = "957700678254493776" //register channel
//const channelId = 986949347621097493 //register channel test
//const channelId = 987257653807947798 ////register channel test2

const permissionedRegisterRole = "Verified"
let sendQueue = {}

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

async function watchQueue() {
    //initialze nonceCounter
    let nonceCounter = await senderAccount.getTransactionCount('pending')
    let loopCounter = 0
    while (true) {
        loopCounter = loopCounter + 1
        if (loopCounter == 30) {
            console.log("watchQueue still running")
            loopCounter = 0
        }
        while (Object.keys(sendQueue).length > 0 ) {
            try {
                console.log(`Getting next item of queue - current length: ${Object.keys(sendQueue).length}`)
                //get next receiver interaction/message from queue
                const userId = Object.keys(sendQueue)[0]
                const [interaction, blnNewUser] = sendQueue[userId]
                delete sendQueue[userId]

                if (blnNewUser) {
                    address = (interaction instanceof Discord.Interaction) ? 
                        interaction.options.getString('address') :
                        interaction.content.slice(1).split(" ")[1] 
                } else {
                    address = dbRegisteredUsers.get(userId, "address")
                }

                //send dusd
                amountdUsd = parseEther("10000")
                const erc20Contract = await ethers.getContractAt(ERC20_ABI, Config.DUSD_CONTRACT)
                console.log(`sending ${amountdUsd} dUSD from ${senderAccount} to ${address}`)
                
                const tx = await erc20Contract.connect(senderAccount).transfer(address, amountdUsd, {nonce: nonceCounter, gasPrice: ethers.utils.parseUnits('40',9)})
                //increment nonceCounter
                nonceCounter = nonceCounter + 1
                if (blnNewUser) {
                    //add user to database
                    dbRegisteredUsers.set(userId, {address: address, 
                        timestampLastClaim: new Date(),
                        nbrClaims:1})
                    replyText = `You successfully registered for DIVA testnet :tada: \n`
                        +`You will shortly receive 10000 dUSD tokens on Goerli\n`
                        +`https://goerli.etherscan.io/tx/${tx.hash}`
                } else {
                    //update timestampLastClaim and counter
                    dbRegisteredUsers.set(userId, new Date(), 'timestampLastClaim')
                    dbRegisteredUsers.set(userId, dbRegisteredUsers.get(userId, "nbrclaims") + 1, 'nbrClaims')
                    replyText = `You will shortly receive 10000 dUSD tokens on Goerli.\n  `
                        +`https://goerli.etherscan.io/tx/${tx.hash}.`
                }
                
                console.log(replyText);
                // we need await to be able to catch an error if a user deleted the original message
                if  (interaction instanceof Discord.Interaction) {
                    await interaction.editReply({
                        content:  replyText,
                        ephemeral: true })
                } else {
                    await interaction.reply(replyText)
                }
                //remove user from queuedUsers dict
                console.log(`removing user ${userId} from the queue`)
            } catch(e){
                console.error(e)
            }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    } 
}


client.login(Config.TOKEN)

client.on("ready", async() => {

    console.log(`Logged in as ${client.user.tag}!`)
    //set guild to DIVA server
    const guildId = '928050978714976326' //DIVA server
    //const guildId = '956290475113971772' //DIVA test server
    //const guildId = '987257653149438013' //DIVA test server2

    const guild = client.guilds.cache.get(guildId)

    //create commands
    let commands = guild.commands

    //reset all commands
    commands.set([])

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
        name: 'claim-test-assets',
        description: 'Request additional testnet collateral tokens',
    })

    //start queue watcher
    watchQueue()
    
})

client.on('interactionCreate', async(interaction) =>{
    try{
        //react to interactions if they are created commands
        if(!interaction.isCommand()) {
            return
        } 
        else {
            //call function from the commands folder with the given commandName
            //check if user has the needed role
            if (interaction.member.roles.cache.some(r => r.name === permissionedRegisterRole)){
                if (["address", "changeaddress"].includes(interaction.commandName)) {
                    client.commands.get(interaction.commandName).execute(interaction,dbRegisteredUsers);
                }
                else if  (["register", "claim-test-assets"].includes(interaction.commandName)) {
                    addToSendQueue = await client.commands.get(interaction.commandName).execute(
                        interaction,
                        dbRegisteredUsers);
                    if (addToSendQueue) {
                        let userId = interaction.user?.id
                        if (userId in sendQueue) {
                            await interaction.reply({
                                content:  `You are already added to the queue. Please wait for the bot to process your request.`,
                                ephemeral: true,
                            })
                        } else {
                            console.log(`Adding user ${userId} to the queue`)
                            sendQueue[userId] = [interaction,(interaction.commandName=="register")]
                        }
                    }
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
        console.error(e)
    }
})


client.on("messageCreate", async (message) => {
    try{

        if(!message.content.startsWith(Config.PREFIX)) return;
        let args = message.content.slice(Config.PREFIX.length).split(" ");
        let commandName = args.shift().toLowerCase();
        console.log(`${message.author.tag} sent "${message.content}".`);
        if (message.channel.id == channelId &&
            message.member.roles.cache.some(r => r.name === permissionedRegisterRole) ) {
            
            if (commandName === 'register' || commandName === 'claim-test-assets' ) {
                addToSendQueue = await client.commands.get(commandName).execute(message,dbRegisteredUsers);
                if (addToSendQueue) {
                    let userId = message.author.id
                    if (userId in sendQueue) {
                        await message.reply(`You are already added to the queue. Please wait for the bot to process your request`)
                    }  else {
                        console.log(`adding user ${userId} to the queue`);
                        sendQueue[userId] = [message, (commandName=="register")]
                    }
                }
            } else if (commandName === 'address') {
                client.commands.get(commandName).execute(message,dbRegisteredUsers);
            } 
        } else { 
            message.reply(`Sorry, you don't have the needed permissions`)
        }
    }
    catch(e){
        console.error(e)
    }
})