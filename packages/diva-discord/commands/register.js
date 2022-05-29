const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')

module.exports = {
    name: 'register',
    async execute(interaction, dbRegisteredUsers, DUSD_CONTRACT, senderAccount) {
        console.log(`Function register called by ${interaction.user?.tag}`)
        //check is user is already registered
        if (dbRegisteredUsers.get(interaction.user?.id) != null) {
            interaction.reply({
                content:  `Your discord account is already registered with address \n `
                +`**${dbRegisteredUsers.get(interaction.user?.id, "address")}** \n `
                +`To change the your ethereum address use\n**/changeaddress ADDRESS**`,
                ephemeral: true,
            })
            return
        }

        //get user input for 'address'
        const address = interaction.options.getString('address')

        //check if wallet is valid
        if (!ethers.utils.isAddress(address))  {
            interaction.reply({
                content:  `The entered address is not a valid Ethereum wallet. Please check your input`,
                ephemeral: true,
            })
            return
        }

        //add user to database
        dbRegisteredUsers.set(interaction.user?.id, {address: address, 
            timestampLastClaim: new Date(),
            nbrClaims:1})
        
        amountdUsd = parseEther("10000")
        console.log(`Loading contract ${DUSD_CONTRACT}`)
        const erc20Contract = await ethers.getContractAt(ERC20_ABI, DUSD_CONTRACT)
        console.log(`sending ${amountdUsd} dUSD from ${senderAccount} to ${address}`)
        const tx = await erc20Contract.connect(senderAccount).transfer(address, amountdUsd)
        //const receipt = await ethers.provider.getTransactionReceipt(tx.hash);

        // Ether amount to send
        let amountInEther = ethers.utils.parseEther('1')
        // Create a transaction object
        let txEth = {
            to: address,
            // Convert currency unit from ether to wei
            value: amountInEther
        }

        console.log(`sending ${amountInEther} ETH from ${senderAccount} to ${address}`)
        // Send a transaction
        const txObj = await senderAccount.sendTransaction(txEth)

        interaction.reply({
        content:  `You successfully registered for DIVA testnet :tada: \n`
        +`You will shortly receive dUSD tokens on ropsten and ropsten ETH\n`
        +`https://ropsten.etherscan.io/tx/${tx.hash} \n`
        +`https://ropsten.etherscan.io/tx/${txObj.hash}`,
        ephemeral: true,
        })
    }
}