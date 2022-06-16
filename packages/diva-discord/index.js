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

client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {

    const command = require(`./commands/${file}`)
    client.commands.set(command.name, command)
    console.log(command.name)
    console.log(command)
}

//const channelId = "957700678254493776" //register channel
const channelId = 986949347621097493 //register channel test
const permissionedRegisterRole = "Verified"
let sendQuque = {}
let nonceCounter = 0 

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

async function watchQuque() {
    while (true) {
        console.log(`checking quque - lenght: ${Object.keys(sendQuque).length}`)
        while  (Object.keys(sendQuque).length > 0 ) {
            //get next receiver interaction/message from quque
            
            const userId = Object.keys(sendQuque)[0]
            const [interaction,  blnNewUser,  byMessage] = sendQuque[userId]

            if (byMessage)  { 
                userName = interaction.author.tag
                address = interaction.content.slice(1).split(" ")[1]
            } else {
                userName = interaction.user?.tag
                address = interaction.options.getString('address')
            }

            //send dusd 
            amountdUsd = parseEther("10000")
            const erc20Contract = await ethers.getContractAt(ERC20_ABI, Config.DUSD_CONTRACT)
            console.log(`sending ${amountdUsd} dUSD from ${senderAccount} to ${address}`)
            
            const tx = await erc20Contract.connect(senderAccount).transfer(address, amountdUsd, {nonce: nonceCounter, gasPrice: ethers.utils.parseUnits('40',9)})

            if (blnNewUser) {
                //add user to database
                dbRegisteredUsers.set(userId, {address: address, 
                    timestampLastClaim: new Date(),
                    nbrClaims:1})
                replyText = `You successfully registered for DIVA testnet :tada: \n`
                    +`You will shortly 10000 dUSD tokens on Ropsten\n`
                    +`https://ropsten.etherscan.io/tx/${tx.hash}`
            } else {
                //update timestampLastClaim and counter
                dbRegisteredUsers.set(userId, new Date(), 'timestampLastClaim')
                dbRegisteredUsers.set(userId, dbRegisteredUsers.get(userId, "nbrclaims") + 1, 'nbrClaims')
                replyText = `You will shortly receive 10000 dUSD tokens on ropsten.\n  `
                    +`https://ropsten.etherscan.io/tx/${tx.hash}.`
            }

            if (byMessage) {
                interaction.reply({
                    content:  replyText,
                    ephemeral: true,
                })
            } else {
                interaction.reply(replyText)
            }
            //remove user from ququedUsers dict
            delete sendQuque[userId]
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    } 
}


client.login(Config.TOKEN)

client.on("ready", async() => {

    console.log(`Logged in as ${client.user.tag}!`)
    //set guild to DIVA server
    //const guildId = '928050978714976326' //DIVA server
    const guildId = '956290475113971772' //DIVA test server
    const guild = client.guilds.cache.get(guildId)

    nonceCounter = await senderAccount.getTransactionCount('pending')
    console.log(nonceCounter)
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

    //start quque watcher
    watchQuque()
    
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
                    client.commands.get(interaction.commandName).execute(
                        interaction,
                        dbRegisteredUsers,
                        false);
                }
                else if  (["register", "claim-test-assets"].includes(interaction.commandName)) {
                    addToSendQuque = await client.commands.get(interaction.commandName).execute(
                        interaction,
                        dbRegisteredUsers,
                        false
                        );
                    if (addToSendQuque) {
                        if (ququedUsers in sendQuque) {
                            interaction.reply({
                                content:  `You are already added to the quque. Please wait for the bot to process your request`,
                                ephemeral: true,
                            })
                        } else {
                            console.log(typeof(interaction))
                            sendQuque[interaction] = [(interaction.commandName="register"), false]
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
        nonceCounter = await senderAccount.getTransactionCount('pending')
        console.log(e)
    }
})


client.on("messageCreate", async (message) => {
    try{
        if(!message.content.startsWith(Config.PREFIX)) return;
        let args = message.content.slice(Config.PREFIX.length).split(" ");
        let commandName = args.shift().toLowerCase();

        if (message.channel.id == channelId &&
            message.member.roles.cache.some(r => r.name === permissionedRegisterRole) ) {
            console.log(`${message.author.tag} sent "${message.content}".`);
            if (commandName === 'register' || commandName === 'claim-test-assets' ) {
                addToSendQuque = await client.commands.get(commandName).execute(
                    message,
                    dbRegisteredUsers,
                    true
                    );
                if (addToSendQuque) {
                    let userId = message.author.id
                    if (userId in sendQuque) {
                        message.reply(`You are already added to the quque. Please wait for the bot to process your request`)
                    }  else {
                        console.log(typeof(message))
                        sendQuque[userId] = [message, (commandName="register"), true]
                    }
                }
            } else if (commandName === 'address') {
                client.commands.get(commandName).execute(
                    message,
                    dbRegisteredUsers,
                    true);
            } 
        } else { 
            message.reply(`Sorry, you don't have the needed permissions`)
        }
    }
    catch(e){
        nonceCounter = await senderAccount.getTransactionCount('pending')
        console.log(e)
    }
})

