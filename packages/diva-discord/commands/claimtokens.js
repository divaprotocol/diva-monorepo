const ERC20_ABI = require('@diva/contracts/abis/erc20.json')
const { parseEther, parseUnits, formatUnits } = require('@ethersproject/units')

module.exports = {
    name: 'claimtokens',
    async execute(interaction, dbRegisteredUsers, senderAccount) {
        console.log(`Function claimtokens called by ${interaction.user?.tag}`)
        const userId = interaction.user?.id

        //check is user is already registered
        if (dbRegisteredUsers.get(userId) == null) {
            interaction.reply({
                content:  `Your discord account is not yet registered.\n `
                            +`Register with **/register ADDRESS**`,
                ephemeral: true,
            })
            return
        }

        //next possible claim is 24h after last claim
        const timeUntilNewClaim = new Date(dbRegisteredUsers.get(userId, "timestampLastClaim")).getTime() + 24 * 60 * 60 * 1000 - new Date()
        console.log(timeUntilNewClaim)
        if ( timeUntilNewClaim > 0 ){
            interaction.reply({
                content:  `You can only claim tokens once per 24h.\n `
                            +`You need to wait ${new Date(timeUntilNewClaim).toISOString().slice(11,19)} before the next claim`,
                ephemeral: true,
            }) 
            return
        }

        address = dbRegisteredUsers.get(userId, "address")

        dbRegisteredUsers.set(userId, new Date(), 'timestampLastClaim')
        dbRegisteredUsers.set(userId, dbRegisteredUsers.get(userId, "nbrclaims") + 1, 'nbrClaims')

        console.log(`Loading contract ${DUSD_CONTRACT}`)
        const erc20Contract = await ethers.getContractAt(ERC20_ABI, DUSD_CONTRACT)
        console.log(`sending ${parseEther("1000")} dUSD from ${senderAccount} to ${address}`)
        const tx = await erc20Contract.connect(senderAccount).transfer(address, parseEther("1000"))

        interaction.reply({
            content:  `You will shortly receive dUSD tokens on ropsten.\n  `
                      +`https://ropsten.etherscan.io/tx/${tx.hash}.`,
            ephemeral: true,
        })
    }
}