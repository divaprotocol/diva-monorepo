import { Address, BigInt, store } from "@graphprotocol/graph-ts"
import {
  DIVAWhitelist,
  DataFeedActivated,
  DataFeedAdded,
  DataProviderAdded,
  DataFeedDeactivated,
  DataProviderDeleted,
  CollateralTokenAdded,
  CollateralTokenDeleted
} from "../generated/DIVAWhitelist/DIVAWhitelist"
import { DataProvider, DataFeed, CollateralToken } from "../generated/schema"
import { Erc20Token } from "../generated/DIVAWhitelist/Erc20Token";

function handleDataProviderEvent(dataProviderAddress: Address, whitelistContract: Address): void {
  let id = dataProviderAddress.toHexString();
  let dataProvider = DataProvider.load(id);

  if (!dataProvider) {
    dataProvider = new DataProvider(id);
  }
  
  let contract = DIVAWhitelist.bind(whitelistContract);
  let dataProviderInfo = contract.getDataProvider(dataProviderAddress);
  dataProvider.name = dataProviderInfo.name;
  dataProvider.publicTrigger = dataProviderInfo.publicTrigger;

  dataProvider.save();
}

function handleDataFeedEvent(dataProviderAddress: Address, index: BigInt, whitelistContract: Address): void {
  let id = dataProviderAddress.toHexString() + "-" + index.toString();
  let dataFeed = DataFeed.load(id);

  if (!dataFeed) {
    dataFeed = new DataFeed(id);
  }
  
  let contract = DIVAWhitelist.bind(whitelistContract);
  let dataFeedInfo = contract.getDataFeed(dataProviderAddress, index);
  dataFeed.referenceAsset = dataFeedInfo.referenceAsset;
  dataFeed.referenceAssetUnified = dataFeedInfo.referenceAssetUnified;
  dataFeed.dataProvider = dataProviderAddress.toHexString(); // in dataProvider, the Id equals the data provider address, hence using dataProviderAddress here
  dataFeed.active = dataFeedInfo.active;
  
  dataFeed.save();
}

export function handleDataProviderAdded(event: DataProviderAdded): void {
  handleDataProviderEvent(event.params.providerAddress, event.address);
}

export function handleDataProviderDeleted(event: DataProviderDeleted): void {
  let id = event.params.providerAddress.toHexString();
  store.remove('DataProvider', id);
}

export function handleDataProviderNameUpdated(event: DataProviderDeleted): void {
  handleDataProviderEvent(event.params.providerAddress, event.address);
}

export function handleDataFeedAdded(event: DataFeedAdded): void {
  handleDataFeedEvent(event.params.providerAddress, event.params.index, event.address);
}

export function handleDataFeedDeactivated(
  event: DataFeedDeactivated
): void {
  handleDataFeedEvent(event.params.providerAddress, event.params.index, event.address);
}

export function handleDataFeedActivated(
  event: DataFeedActivated
): void {
  handleDataFeedEvent(event.params.providerAddress, event.params.index, event.address);
}

export function handleCollateralTokenAdded(
  event: CollateralTokenAdded
): void {
  let collateralTokenAddress = event.params.collateralToken;
  let id = collateralTokenAddress.toHexString();
  let collateralToken = CollateralToken.load(id);

  if (!collateralToken) {
    collateralToken = new CollateralToken(id);
  }

  let tokenContract = Erc20Token.bind(collateralTokenAddress);
  collateralToken.name = tokenContract.name();
  collateralToken.symbol = tokenContract.symbol();
  collateralToken.decimals = tokenContract.decimals();

  collateralToken.save();
}

export function handleCollateralTokenDeleted(
  event: CollateralTokenDeleted
): void {
  let id = event.params.collateralToken.toHexString();
  store.remove('CollateralToken', id);
}
