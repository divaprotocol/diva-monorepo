const Discord = require('discord.js')

module.exports = {
    name: 'register',
    async execute(interaction, dbRegisteredUsers ) {
        try {

            let userId =""
            let userName = ""
            let address = ""
            let replyText = ""
            let addToSendQueue = false

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (interaction instanceof Discord.Message)  { 
                userId = interaction.author.id
                userName = interaction.author.tag
                address = interaction.content.slice(1).split(" ")[1]
            } else {
                userId = interaction.user?.id
                userName = interaction.user?.tag
                address = interaction.options.getString('address')
            }

            console.log(`Function register called by ${userName}`)
            //check is user is already registered
            if (dbRegisteredUsers.get(userId) != null) {
                replyText = `Your discord account is already registered with address \n `
                    +`**${dbRegisteredUsers.get(userId, "address")}** \n `
            } else if (!ethers.utils.isAddress(address)) {
                replyText = `The entered address ${address} is not a valid Ethereum wallet. Please check your input` 
            } else {
                addToSendQueue = true
                if (interaction instanceof Discord.Interaction) {
                    await interaction.deferReply({ephemeral: true})
                }
            }

            console.log(replyText);
            if (replyText != "") {
                (interaction instanceof Discord.Message) ?
                    await interaction.reply(replyText) :
                    await interaction.reply({
                        content:  replyText,
                        ephemeral: true,
                        })
            }
            return addToSendQueue
        }
        catch(e){
            console.error(e)
            return false
        }
    }
}
    //const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    /*
    // Ether amount to send
    let amountInEther = ethers.utils.parseEther('1')
    // Create a transaction object
    let txEth = {
        nonce: nonceCounter,
        to: address,
        // Convert currency unit from ether to wei
        value: amountInEther,
        gasPrice: ethers.utils.parseUnits('40',9),
    }

    console.log(`sending ${amountInEther} ETH from ${senderAccount} to ${address}`)
    // Send a transaction
    const txObj = await senderAccount.sendTransaction(txEth)
    nonceCounter = nonceCounter + 1
    */