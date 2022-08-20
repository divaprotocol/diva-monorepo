const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')

module.exports = {
    name: 'register-by-message',
    async execute(message, dbRegisteredUsers, DUSD_CONTRACT, senderAccount, nonceCounter) {

        try {
            const userId = message.author.id
            const userName = message.author.tag
            const address = message.content.slice(Config.PREFIX.length).split(" ")[0]
            
            console.log(`Function register called by ${message.user?.tag}`)
            //check is user is already registered
            if (dbRegisteredUsers.get(userId) != null) {
                message.reply(`Your discord account is already registered with address \n `
                    +`**${dbRegisteredUsers.get(userId, "address")}** \n `)
                return false
            }

            //check if wallet is valid
            if (!ethers.utils.isAddress(address))  {
                message.reply(`The entered address is not a valid Ethereum wallet. Please check your input`,)
                return false
            }       
            

            amountdUsd = parseEther("10000")
            console.log(`Loading contract ${DUSD_CONTRACT}`)
            const erc20Contract = await ethers.getContractAt(ERC20_ABI, DUSD_CONTRACT)
            console.log(`sending ${amountdUsd} dUSD from ${senderAccount} to ${address}`)
            
            const tx = await erc20Contract.connect(senderAccount).transfer(address, amountdUsd, {nonce: nonceCounter, gasPrice: ethers.utils.parseUnits('40',9)})
        
            //add user to database
            dbRegisteredUsers.set(userId, {address: address, 
                timestampLastClaim: new Date(),
                nbrClaims:1})

            message.reply(
            `You successfully registered for DIVA testnet :tada: \n`
            +`You will shortly 10000 dUSD tokens on Ropsten\n`
            +`https://ropsten.etherscan.io/tx/${tx.hash}`)
            return true
        }
        catch(e){
            console.log(e)
            return false
        }
    }
}   
