module.exports = {
    name: 'register',
    async execute(interaction, dbRegisteredUsers, byMessage ) {
        try {

            let userId =""
            let userName = ""
            let address = ""
            let replyText = ""
            let addToSendQuque = false

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (byMessage)  { 
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
                addToSendQuque = true
            }

            console.log(replyText)
            if (replyText != "") {
                if (byMessage) {
                    interaction.reply({
                        content:  replyText,
                        ephemeral: true,
                        })
                } else {
                    interaction.reply(replyText)
                }
            }
            return addToSendQuque
        }
        catch(e){
            console.log(e)
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