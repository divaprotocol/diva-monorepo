import axios from "axios";

const ordersUrl = 'https://ropsten.api.0x.org/sra/v4/orders?makerToken='

export const get0xOpenOrders = (CollateralToken) => {
    const res = axios.get(ordersUrl+CollateralToken)
    .then(function(response) {
        console.log("response - "+JSON.stringify(response))
        return response;
    })
    .catch(error => {
        return {};
    })

    return res;
}