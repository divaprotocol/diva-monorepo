import { contractAddresses } from './Config'
import { NULL_ADDRESS } from './Config';
import { CHAIN_ID } from './Config';
import { utils } from './Config';
import { metamaskProvider } from './Config';
import { ROPSTEN } from './Config'
 
export const buylimitOrder = async (orderData) => {   
    const getFutureExpiryInSeconds = () =>
        Math.floor(Date.now() / 1000 + 300).toString(); // 5 min expiry

    const order = new utils.LimitOrder({
        makerToken: contractAddresses.etherToken,
        takerToken: contractAddresses.zrxToken,
        makerAmount: "1", // NOTE: This is 1 WEI, 1 ETH would be 1000000000000000000
        takerAmount: "1000000000000000", // NOTE this is 0.001 ZRX. 1 ZRX would be 1000000000000000000
        maker: orderData.maker,
        sender: NULL_ADDRESS,
        expiry: getFutureExpiryInSeconds(),
        salt: Date.now().toString(),
        chainId: CHAIN_ID,
        verifyingContract: contractAddresses.exchangeProxy
    });
    
    try {
        const signature = await order.getSignatureWithProviderAsync(
            metamaskProvider,
            utils.SignatureType.EIP712 // Optional
        )
        const signedOrder = { ...order, signature };
        const resp = await fetch(ROPSTEN, {
            method: "POST",
            body: JSON.stringify(signedOrder),
            headers: {
                "Content-Type": "application/json"
            }
        });
    
        if (resp.status === 200) {
            alert("Successfully posted order to SRA");
        } else {
            const body = await resp.json();
            alert(`ERROR(status code ${resp.status}): ${JSON.stringify(body, undefined, 2)}`)
        }
    } catch(e)  {
        alert("You need to sign the order")
    } 
}
  
  