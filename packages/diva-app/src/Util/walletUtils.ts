/* eslint-disable prettier/prettier */
type ERC20Options = {
    address: string
    symbol: string
    decimals: number
    image: string
}

const sendAddAssetTransaction = async (
    sendTransaction: any,
    options: ERC20Options
) => {
    try {
        await sendTransaction({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: options,
            },
        })
    } catch (error) {
        console.error('Error in sendAddAssetTransaction', error)
    }
}

export { sendAddAssetTransaction }
