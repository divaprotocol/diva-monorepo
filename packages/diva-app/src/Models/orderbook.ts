interface BaseInterface {
  baseToken: string // baseToken of order
  quoteToken: string // quoteToken of order
}

export interface PoolInfoType extends BaseInterface {
  poolId: string // pool id
  collateralTokenDecimals: number // collateral token decimals of pool
}

export interface OrderbookPriceRequest {
  chainId: number // chain id
  page: number // current page. start from 0
  perPage: number // page size
  graphUrl: string // graphql url to getting the pools
  createdBy?: string // creator address
  taker?: string // taker address
  feeRecipient?: string // fee recipient address
  takerTokenFee?: number // 1 = 0.001%
  threshold?: number // threshold
  count?: number // count
  poolInfo: PoolInfoType[]
}

interface OrderbookPriceResponse {
  order?: {
    maker: string // maker address of order
    taker: string // taker address of order
    makerToken: string // makerToken address of order
    takerToken: string // takerToken address of order
    makerAmount: number // makerAmount of order
    takerAmount: number // takerAmount of order
    takerTokenFeeAmount: number // takerToken fee amount of order
    feeRecipient: string // fee recipient address
    expiry: string // order expire time
  }
  metaData?: {
    remainingFillableTakerAmount: number // remaining fillable taker amount of order
  }
}

export interface PriceResponseType extends BaseInterface {
  bids: OrderbookPriceResponse[] // best bids
  asks: OrderbookPriceResponse[] // best asks
}

export interface PriceOutputType extends BaseInterface {
  poolId: string // pool id
  type: string // pool type such as Long or Short
  decimals: number // collateral token decimals of pool
  bid: OrderbookPriceResponse // best bid
  ask: OrderbookPriceResponse // best ask
}

export interface OrderOutputType {
  orderType: string // order type such as buy or sell
  poolId: string // pool id
  bidExpiry: string // bid expiry time
  askExpiry: string // ask expire time
  bid?: string // best bid
  ask?: string // bese ask
  bidQuantity: string // bid quantity
  askQuantity: string // ask quantity
}

export const ORDER_TYPE = {
  BUY: 0,
  SELL: 1,
}
