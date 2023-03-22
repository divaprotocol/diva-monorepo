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



# Trouble shooting

* Error on deployment: `The Subgraph Studio only allows subgraphs for these networks: mainnet, rinkeby`
   * Solution: Try to install the dependencies by running `yarn` in the `diva-monorepo` directory.

# Links

* [Graph Protocol Docs](https://thegraph.com/docs/en/)
* [Hosted service](https://thegraph.com/hosted-service)
* [Subgraph studio](https://thegraph.com/studio/)