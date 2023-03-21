# What is a subgraph

A subgraph extracts data from a blockchain, processes it and stores it so that it can be easily queried via GraphQL.

# Subgraph deployment

The Graph Protocol offers two deployment options:
1. [Hosted service](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/#create-a-subgraph-on-the-hosted-service)
1. [Subgraph studio](https://thegraph.com/docs/en/deploying/subgraph-studio/#how-to-create-your-subgraph-in-subgraph-studio)

For some networks like Ethereum and its testnets (e.g., Goerli), the hosted service is no longer supported, while for other networks like Mumbai or Polygon it is still supported. The supported networks are listed in the official Graph Protocol [docs](https://thegraph.com/docs/en/developing/supported-networks/).

## Creating a subgraph entity

Before deploying the subgraph, you need to create it through the [hosted service](https://thegraph.com/docs/en/deploying/deploying-a-subgraph-to-hosted/#create-a-subgraph-on-the-hosted-service) or the [Subgraph Studio UI](https://thegraph.com/docs/en/deploying/subgraph-studio/#how-to-create-your-subgraph-in-subgraph-studio). This is a one-off process that establishes the basic configuration and settings for the subgraph.

After you have created the subgraph, you will be able to deploy it using the command-line commands listed in the following sections.

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

Note that the `build` command defined in `package.json` is based on the `goerli.subgraph.yaml` file, which includes references to the DIVA Protocol and 0x Protocol. However, the 0x Protocol is not available on some chains, including Sepolia. In this case, you should build the subgraph with the `sepolia.subgraph.yaml` file by running the following command (also defined inside `package.json`):
```
yarn build:sepolia
```

## Deployment

Deploying the subgraph will upload the subgraph files that have been built with `yarn build` to IPFS and tell the Graph Explorer to start indexing your subgraph using these files. The subgraph can be deployed to either the [hosted service](#hosted-service) or the [Subgraph Studio](#subgraph-studio).

### Hosted service

If you're deploying the subgraph on the hosted service, you need to authenticate your access to the hosted service by running the following command:
```
yarn graph:auth-hosted
```

You will receive a prompt to enter the Access Token key ("Deploy key") which you can obtain from the Graph UI. Then, you can deploy your subgraph by running the following command (here using the Goerli network as an example):
```
yarn deploy:mumbai:hosted
```

>**Note:** Unlike [deploying on the Subgraph Studio](#deploying-a-subgraph-on-the-subgraph-studio), there is no need to replace the `$THEGRAPH_ACCESS_TOKEN` placeholder in the `package.json` with your Access Token before running the `yarn graph:auth-hosted` command.

### Subgraph Studio

If you're deploying the subgraph on the Subgraph Studio, you'll need to replace the `$DIVA_SUBGRAPH_STUDIO_ACCESS_TOKEN` placeholder in the `package.json` file with your Access Token. Once you've done that, run the following command to authenticate your access:
```
graph:auth-goerli-studio
```

Next, replace the `$DIVA_SUBGRAPH_STUDIO_SLUG_230226` placeholder in the `package.json` file with the actual key. Then, deploy your subgraph by running:
```
yarn deploy:goerli:studio
```

>**Note:** The slug is a unique identifier for a subgraph and hence different for every subgraph in Subgraph Studio. Slugs need to be added as organization secrets in Github in order to ensure a successful Github run.

Don't forget to undo the `$DIVA_SUBGRAPH_STUDIO_ACCESS_TOKEN` and `$DIVA_SUBGRAPH_STUDIO_SLUG_230226` replacements after you've deployed the subgraph.

>Note that the secrets `$DIVA_SUBGRAPH_STUDIO_ACCESS_TOKEN` and `$DIVA_SUBGRAPH_STUDIO_SLUG_230226` are set up in Github and would be picked automatically during the automatic deployment Github run.

# Links

* [Graph Protocol Docs](https://thegraph.com/docs/en/)
* [Hosted service](https://thegraph.com/hosted-service)
* [Subgraph studio](https://thegraph.com/studio/)