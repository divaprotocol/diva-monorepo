# What is the DIVA subgraph

The DIVA subgraph is a software component that uses the [Graph Protocol](https://thegraph.com/docs/en/) to extract and process data related to the DIVA Protocol from a blockchain network, and store it in a format that is easily searchable and queryable through GraphQL. This data can then be used by applications and services built on top of DIVA Protocol.

The storage structure of the data and the relationships are defined in the `schema.graphql` file. The logic to transform the raw blockchain data into the defined schema is defined in the `src/mapping.ts` file.

# DIVA subgraphs by network

The DIVA subgraph is available on the following networks:

| Network        | Explorer URL |Development URL | Service |
| :---------------- |:---------------- |:---------------- |:---------------- |
| **Mainnet**                                                               |                                                                                                                                                           |||
| Ethereum  | ... ||Subgraph Studio|
| Polygon  | https://thegraph.com/explorer/subgraph/divaprotocol/diva-polygon-230226 |https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon-230226|Hosted Service|
| Arbitrum  | ... ||Hosted Service|
**Testnet**                                                               |                                                                                                                                                           |||
| Goerli  |https://thegraph.com/studio/subgraph/diva-goerli-230226/playground| https://api.studio.thegraph.com/query/14411/diva-goerli-230226/0.0.1 |Subgraph Studio|
| Mumbai  |https://thegraph.com/hosted-service/subgraph/divaprotocol/diva-mumbai-230226| https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai-230226 |Hosted Service|

The following sections provide a comprehensive guide how to create, deploy and publish the DIVA subgraph on new networks and environments.

# Subgraph deployment options

When deploying a subgraph on the Graph Protocol, there are two main environments to choose from:

1. [Hosted Service](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/#create-a-subgraph-on-the-hosted-service): This is a **cloud-based service** provided by The Graph team, which allows developers to deploy their subgraphs without worrying about infrastructure management.
1. [Subgraph Studio](https://thegraph.com/docs/en/deploying/subgraph-studio/#how-to-create-your-subgraph-in-subgraph-studio): This is a dapp that allows developers to create, manage, and publish subgraphs on the **decentralized network**. The Subgraph Studio UI also provides a range of helpful features to simplify the process of building and testing subgraphs.

Deploying the subgraph will upload the subgraph files that have been built with `yarn build` to IPFS and tell the Graph Explorer to start indexing your subgraph using these files. 

**Note:**
* Not all networks are supported by the Hosted Service. For example, Ethereum and its testnets (e.g., Goerli) are no longer supported, while other networks like Mumbai or Polygon are still supported. A full list of supported networks can be found in the official Graph Protocol [docs](https://thegraph.com/docs/en/developing/supported-networks/).
* Deploying a subgraph to Subgraph Studio does not automatically publish it to the decentralized network. The user has to publish it manually via the Studio UI.

## Creating a subgraph entity (one-off)

Before deploying a subgraph to a new network or environment, you need to create it through the [Hosted Service](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/#create-a-subgraph-on-the-hosted-service) or the [Subgraph Studio UI](https://thegraph.com/docs/en/deploying/subgraph-studio/#how-to-create-your-subgraph-in-subgraph-studio) first. This is a one-off process that establishes the basic configuration and settings for the subgraph.

The subgraph entities are referenced when running `graph deploy` related scripts. See `deploy:mumbai:hosted` and `deploy:goerli:studio` scripts in the `package.json` file for reference.

After you have created the subgraph, you will be able to deploy it using the command-line commands listed below.

<!-- ## Deploying to the Hosted Service

```
yarn codegen
yarn build
yarn graph:auth:hosted
yarn deploy:mumbai:hosted
```

## Deploying to the Subgraph Studio

```
yarn codegen
yarn build
yarn graph:auth:goerli:studio
yarn deploy:goerli:studio
``` -->

## Generate typings

```
yarn codegen
```

The `codegen` command generates TypeScript definitions for the smart contracts and the event ABIs that the subgraph will listen to. This allows the subgraph mappings to interact with Ethereum smart contracts and event data in a type-safe way.

## Build

```
yarn build
```

The `build` command compiles the subgraph mappings (written in TypeScript or AssemblyScript) into WebAssembly, validates the subgraph, and generates a compiled subgraph manifest and schema that can be used to deploy the subgraph to a network.

Note that the `build` command defined in the `package.json` file is based on the `goerli.subgraph.yaml` file, which includes references to both the DIVA Protocol and 0x Protocol. However, the 0x Protocol is not available on some chains, including Sepolia. In this case, you should build the subgraph with the `sepolia.subgraph.yaml` file (`build:sepolia`).

### Deploying to Hosted service

If you want to deploy the subgraph to the Hosted Service, you first need to authenticate your access to the Hosted Service by running the following command:
```
yarn graph:auth:hosted
```

You will receive a prompt to enter the Access Token key ("Deploy key"), which you can obtain from the Graph UI. Then, you can deploy your subgraph by running the following command (here using the Goerli network as an example):
```
yarn deploy:mumbai:hosted
```

Note that unlike [deploying to the Subgraph Studio](#deploying-a-subgraph-on-the-subgraph-studio), there is no need to replace the `$THEGRAPH_ACCESS_TOKEN` placeholder in the `package.json` file with your Access Token before running the `yarn graph:auth:hosted` command.

### Deploying to Subgraph Studio

If you want to deploy the subgraph to the Subgraph Studio, you'll need to replace the `$DIVA_SUBGRAPH_STUDIO_ACCESS_TOKEN` placeholder in the `package.json` file with your Access Token. Once you've done that, run the following command to authenticate your access:
```
graph:auth-goerli-studio
```

Next, replace the `$DIVA_SUBGRAPH_STUDIO_SLUG_230226` placeholder in the `package.json` file with the actual slug of the subgraph. Then, deploy your subgraph by running:
```
yarn deploy:goerli:studio
```

You will be asked to enter a version label. We recommend using the version format `0.0.0`, without a leading "`v`". 

Note that deploying the subgraph to Subgraph Studio allows you to test and update the subgraph's metadata, but it does not publish the subgraph to the decentralized network. To publish the subgraph, you have to click the "Publish" button in the Studio UI.

>⚠️**Important:** Don't forget to undo the `$DIVA_SUBGRAPH_STUDIO_ACCESS_TOKEN` and `$DIVA_SUBGRAPH_STUDIO_SLUG_230226` replacements after you've deployed the subgraph.

>💡**Note:** The slug is a unique identifier for every subgraph in Subgraph Studio. Slugs need to be added as organization secrets in Github in order to ensure a successful Github run.

# CI/CD

After deploying a new subgraph, add the correspondig commands in the `package.json` file and update the `deploy` script to deploy them automatically when a PR is opened or a branch is merged into `main`.

# Example queries

* [Pool data](#pool-data)
* [Pool data for data providers](#pool-data-for-data-providers)
* [Fee claims](#fee-claims)
* [Challenges](#challenges)
* [User positions](#user-positions)

Refer to the official The Graph [docs](https://thegraph.com/docs/en/querying/querying-best-practices/#sending-a-query-to-a-graph-ql-api) for best practices in querying subgraph data.

## Pool data

The following query can be used to pull the data for a given pool Id (here pool Id = 1):

```js
{
  pools(where: {id: 1}) {
    id
    referenceAsset
    floor
    inflection
    cap
    gradient  
    supplyShort
    supplyLong
    expiryTime
    collateralToken {
      id
      name
      symbol
      decimals
    }
    collateralBalance    
    collateralBalanceGross
    capacity
    shortToken {
      id
      name
      symbol
      decimals
    }
    longToken {
      id
      name
      symbol
      decimals
    }
    finalReferenceValue
    statusFinalReferenceValue
    statusTimestamp
    payoutLong
    payoutShort
    dataProvider
    protocolFee
    settlementFee
    submissionPeriod
    challengePeriod
    reviewPeriod
    fallbackSubmissionPeriod
    permissionedERC721Token
    createdBy
    createdAt
  }
}
```

Sample output from the above query:

```js
{
  "data": {
    "pools": [
      {
        "id": "1",
        "referenceAsset": "ETH/USD",
        "floor": "2000000000000000000000",
        "inflection": "2500000000000000000000",
        "cap": "3000000000000000000000",
        "gradient": "500000000000000000",
        "supplyShort": "100000000000000000000",
        "supplyLong": "100000000000000000000",
        "expiryTime": "1679479028",
        "collateralToken": {
          "id": "0xfa158c9b780a4213f3201ae74cca013712c8538d",
          "name": "DIVA USD",
          "symbol": "dUSD",
          "decimals": 18
        },
        "collateralBalance": "100000000000000000000",
        "collateralBalanceGross": "100000000000000000000",
        "capacity": "200000000000000000000",
        "shortToken": {
          "id": "0x40624669b4ae83a1745b6094e3016f6f9b4214cf",
          "name": "S1",
          "symbol": "S1",
          "decimals": 18
        },
        "longToken": {
          "id": "0xde318bba1a74cf9cf052e9ae94330aa4f02c6fb5",
          "name": "L1",
          "symbol": "L1",
          "decimals": 18
        },
        "finalReferenceValue": "0",
        "statusFinalReferenceValue": "Open",
        "statusTimestamp": "1677479088",
        "payoutLong": "0",
        "payoutShort": "0",
        "dataProvider": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
        "protocolFee": "2500000000000000",
        "settlementFee": "500000000000000",
        "submissionPeriod": "604800",
        "challengePeriod": "259200",
        "reviewPeriod": "432000",
        "fallbackSubmissionPeriod": "864000",
        "permissionedERC721Token": "0x0000000000000000000000000000000000000000",
        "createdBy": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
        "createdAt": "1677479088"
      }
    ]
  }
}
```

## Pool data for data providers

Data providers that are looking to track pools where they have been selected for outcome reporting can use the following pool query, reduced to the most relevant fields for their specific needs. Please ensure that you provide the data provider address in the `where` condition in lowercase.

```js
{ 
    pools (first: 1000, where: {
      expiryTime_gt: "1667147292",
      expiryTime_lte: "1687752092",
      statusFinalReferenceValue: "Open",
      dataProvider: "0x9adefeb576dcf52f5220709c1b267d89d5208d78"}
      ) {
        id
        referenceAsset
        expiryTime
        dataProvider
        finalReferenceValue
        statusFinalReferenceValue
        statusTimestamp
        collateralToken {
          id
          name
          symbol
          decimals
        }
        collateralBalanceGross
        settlementFee
        challenges {
          challengedBy
          proposedFinalReferenceValue
        }
        submissionPeriod
        challengePeriod
        reviewPeriod
        createdAt
        createdBy
    }
}
```

Sample output of the above query:

```js
{
  "data": {
    "pools": [
      {
        "id": "1",
        "referenceAsset": "ETH/USD",
        "expiryTime": "1679479028",
        "dataProvider": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
        "finalReferenceValue": "0",
        "statusFinalReferenceValue": "Open",
        "statusTimestamp": "1677479088",
        "collateralToken": {
          "id": "0xfa158c9b780a4213f3201ae74cca013712c8538d",
          "name": "DIVA USD",
          "symbol": "dUSD",
          "decimals": 18
        },
        "collateralBalanceGross": "100000000000000000000",
        "settlementFee": "500000000000000",
        "challenges": [],
        "submissionPeriod": "604800",
        "challengePeriod": "259200",
        "reviewPeriod": "432000",
        "createdAt": "1677479088",
        "createdBy": "0x9adefeb576dcf52f5220709c1b267d89d5208d78"
      }
    ]
  }
}
```



## Fee claims

Query to pull the fee claims for a given address (has to be provided in lower case):

```js
{
  feeRecipients(where: {id: "0x9adefeb576dcf52f5220709c1b267d89d5208d78"}) {
    id
    collateralTokens {
      amount
      collateralToken {
        id
        name
        symbol
        decimals
      }
    }
  }
}
```

Sample output from the above query:

```js
{
  "data": {
    "feeRecipients": [
      {
        "id": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
        "collateralTokens": [
          {
            "amount": "32695586760280840",
            "collateralToken": {
              "id": "0x867e53fede91d27101e062bf7002143ebaea3e30",
              "name": "WAGMI18",
              "symbol": "WAGMI18"
            }
          },
          {
            "amount": "30000",
            "collateralToken": {
              "id": "0x8ca8de48c4507fa54a83dde7ac68097e87520eec",
              "name": "WAGMI6",
              "symbol": "WAGMI6"
            }
          }
        ]
      }
    ]
  }
}
```

## Challenges

Query to retrieve the submitted challenges for a given poolId (here poolId = 5):

```js
{
  challenges(where: {pool: "5"}) {
    challengedBy
    proposedFinalReferenceValue
    pool {
      id
    }
  }
}
```

Sample output of above query:

```js
{
  "data": {
    "challenges": [
      {
        "challengedBy": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
        "proposedFinalReferenceValue": "1670000000000000000000",
        "pool": {
          "id": "5"
        }
      }
    ]
  }
}
```

## User positions

Query to retrieve a shortlist of position tokens that a user may own. The shortlist is constructed based on user interactions with the DIVA Protocol as well as the 0x Protocol. Note that position tokens received via different avenues (e.g., Uniswap or simple transfer) will not appear in this list.

```js
{
  user(id: "0x9adefeb576dcf52f5220709c1b267d89d5208d78" ){
    id
    positionTokens(first: 100,
      orderDirection: desc,
      orderBy: receivedAt,) {
        receivedAt,
        positionToken {
        id
        name
        symbol
        decimals
        owner
        pool {
          id
          referenceAsset
          floor
          inflection
          cap
          gradient  
          supplyShort
          supplyLong
          expiryTime
          collateralToken {
            id
            name
            symbol
            decimals
          }
          collateralBalance    
          collateralBalanceGross
          capacity
          shortToken {
            id
            name
            symbol
            decimals
          }
          longToken {
            id
            name
            symbol
            decimals
          }
          finalReferenceValue
          statusFinalReferenceValue
          statusTimestamp
          payoutLong
          payoutShort
          dataProvider
          protocolFee
          settlementFee
          submissionPeriod
          challengePeriod
          reviewPeriod
          fallbackSubmissionPeriod
          permissionedERC721Token
          createdBy
          createdAt
        }
      }
    }
  }
}
```

Sample output of above query:

```js
{
  "data": {
    "user": {
      "id": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
      "positionTokens": [
        {
          "receivedAt": "1677479088",
          "positionToken": {
            "id": "0xde318bba1a74cf9cf052e9ae94330aa4f02c6fb5",
            "name": "L1",
            "symbol": "L1",
            "decimals": 18,
            "owner": "0xa6e26dba7aa0d065b3c866bb61b4aef3bb9d4874",
            "pool": {
              "id": "1",
              "referenceAsset": "ETH/USD",
              "floor": "2000000000000000000000",
              "inflection": "2500000000000000000000",
              "cap": "3000000000000000000000",
              "gradient": "500000000000000000",
              "supplyShort": "100000000000000000000",
              "supplyLong": "100000000000000000000",
              "expiryTime": "1679479028",
              "collateralToken": {
                "id": "0xfa158c9b780a4213f3201ae74cca013712c8538d",
                "name": "DIVA USD",
                "symbol": "dUSD",
                "decimals": 18
              },
              "collateralBalance": "100000000000000000000",
              "collateralBalanceGross": "100000000000000000000",
              "capacity": "200000000000000000000",
              "shortToken": {
                "id": "0x40624669b4ae83a1745b6094e3016f6f9b4214cf",
                "name": "S1",
                "symbol": "S1",
                "decimals": 18
              },
              "longToken": {
                "id": "0xde318bba1a74cf9cf052e9ae94330aa4f02c6fb5",
                "name": "L1",
                "symbol": "L1",
                "decimals": 18
              },
              "finalReferenceValue": "0",
              "statusFinalReferenceValue": "Open",
              "statusTimestamp": "1677479088",
              "payoutLong": "0",
              "payoutShort": "0",
              "dataProvider": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
              "protocolFee": "2500000000000000",
              "settlementFee": "500000000000000",
              "submissionPeriod": "604800",
              "challengePeriod": "259200",
              "reviewPeriod": "432000",
              "fallbackSubmissionPeriod": "864000",
              "permissionedERC721Token": "0x0000000000000000000000000000000000000000",
              "createdBy": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
              "createdAt": "1677479088"
            }
          }
        },
        {
          "receivedAt": "1677479088",
          "positionToken": {
            "id": "0x40624669b4ae83a1745b6094e3016f6f9b4214cf",
            "name": "S1",
            "symbol": "S1",
            "decimals": 18,
            "owner": "0xa6e26dba7aa0d065b3c866bb61b4aef3bb9d4874",
            "pool": {
              "id": "1",
              "referenceAsset": "ETH/USD",
              "floor": "2000000000000000000000",
              "inflection": "2500000000000000000000",
              "cap": "3000000000000000000000",
              "gradient": "500000000000000000",
              "supplyShort": "100000000000000000000",
              "supplyLong": "100000000000000000000",
              "expiryTime": "1679479028",
              "collateralToken": {
                "id": "0xfa158c9b780a4213f3201ae74cca013712c8538d",
                "name": "DIVA USD",
                "symbol": "dUSD",
                "decimals": 18
              },
              "collateralBalance": "100000000000000000000",
              "collateralBalanceGross": "100000000000000000000",
              "capacity": "200000000000000000000",
              "shortToken": {
                "id": "0x40624669b4ae83a1745b6094e3016f6f9b4214cf",
                "name": "S1",
                "symbol": "S1",
                "decimals": 18
              },
              "longToken": {
                "id": "0xde318bba1a74cf9cf052e9ae94330aa4f02c6fb5",
                "name": "L1",
                "symbol": "L1",
                "decimals": 18
              },
              "finalReferenceValue": "0",
              "statusFinalReferenceValue": "Open",
              "statusTimestamp": "1677479088",
              "payoutLong": "0",
              "payoutShort": "0",
              "dataProvider": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
              "protocolFee": "2500000000000000",
              "settlementFee": "500000000000000",
              "submissionPeriod": "604800",
              "challengePeriod": "259200",
              "reviewPeriod": "432000",
              "fallbackSubmissionPeriod": "864000",
              "permissionedERC721Token": "0x0000000000000000000000000000000000000000",
              "createdBy": "0x9adefeb576dcf52f5220709c1b267d89d5208d78",
              "createdAt": "1677479088"
            }
          }
        }
      ]
    }
  }
}
```

# Trouble shooting

| Error        | Solution |
| :---------------- |:---------------- |
| `The Subgraph Studio only allows subgraphs for these networks: mainnet, rinkeby`  | Try to install the dependencies by running `yarn` in the `diva-monorepo` directory and deploy again. |

# Links

* [Graph Protocol Docs](https://thegraph.com/docs/en/)
* [Hosted service](https://thegraph.com/hosted-service)
* [Subgraph studio](https://thegraph.com/studio/)