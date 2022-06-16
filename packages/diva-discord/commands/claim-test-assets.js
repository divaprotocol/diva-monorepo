const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')

module.exports = {
    name: 'claim-test-assets',
    async execute(interaction, dbRegisteredUsers, DUSD_CONTRACT, senderAccount, nonceCounter, byMessage) {
        try{
            let userId =""
            let userName = ""
            let replyText = ""
            let blnIncreaseNonce = false

            //users can register by / command or via message. Depending on the way the parameters have to be read 
            // and the reply needs to be send different.
            if (byMessage)  { 
                userId = interaction.author.id
                userName = interaction.author.tag
            } else {
                userId = interaction.user?.id
                userName = interaction.user?.tag
            }

            console.log(`Function claimtokens called by ${userName}`)

            //check is user is already registered
            if (dbRegisteredUsers.get(userId) == null) {
                replyText = `Your discord account is not yet registered.\n `
                +`Register with **/register ADDRESS**`
            } else {
                //next possible claim is 24h after last claim
                const timeUntilNewClaim = new Date(dbRegisteredUsers.get(userId, "timestampLastClaim")).getTime() + 24 * 60 * 60 * 1000 - new Date()    
                if ( timeUntilNewClaim > 0 ){
                    replyText = `You can only claim tokens once per 24h.\n `
                    +`You need to wait ${new Date(timeUntilNewClaim).toISOString().slice(11,19)} before the next claim`
                } else {
                    address = dbRegisteredUsers.get(userId, "address")

                    dbRegisteredUsers.set(userId, new Date(), 'timestampLastClaim')
                    dbRegisteredUsers.set(userId, dbRegisteredUsers.get(userId, "nbrclaims") + 1, 'nbrClaims')
        
                    console.log(`Loading contract ${DUSD_CONTRACT}`)
                    const erc20Contract = await ethers.getContractAt(ERC20_ABI, DUSD_CONTRACT)
                    console.log(`sending ${parseEther("10000")} dUSD from ${senderAccount} to ${address}`)
        
                    const tx = await erc20Contract.connect(senderAccount).transfer(address, parseEther("10000"), {nonce: nonceCounter, gasPrice: ethers.utils.parseUnits('40',9)})
                    replyText = `You will shortly receive 10000 dUSD tokens on ropsten.\n  `
                        +`https://ropsten.etherscan.io/tx/${tx.hash}.`
                    blnIncreaseNonce = true
                }
            }

            console.log(replyText)
            if (byMessage) {
                interaction.reply({
                    content:  replyText,
                    ephemeral: true,
                    })
            } else {
                interaction.reply(replyText)
            }
            return blnIncreaseNonce
            
        } catch (e) {
            console.log(e);
            return false
        } 
    }
}