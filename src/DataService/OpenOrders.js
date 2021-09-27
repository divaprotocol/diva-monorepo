import axios from "axios";

const ordersUrl = 'https://ropsten.api.0x.org/sra/v4/orders?makerToken='

export const get0xOpenOrders = (CollateralToken, TokenAddress) => {
    const res = axios.get(ordersUrl+CollateralToken+'&takerToken='+TokenAddress)
    .then(function(response) {
        return response;
    })
    .catch(error => {
        return {};
    })

    return res;
}