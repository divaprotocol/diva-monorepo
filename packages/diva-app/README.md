# Divaprotocol Dapp

## Getting Started

We're using `yarn` for dependency management. It's features are pretty much the same as for npm. If you know how to use npm, you already know how to use yarn.

1. `npm install -g yarn` if you haven't got yarn on your machine yet.
2. Navigate to `diva-monorepo` 
3. Run `yarn` to install all dependencies
4. Install VStudio plugins for Prettier & Eslint (if you don't have it yet)
5. Navigate to `packages/diva-app`
6. Run `yarn build` to build all the relevant files (e.g., abis)
7. Run `yarn fmt`
8. Run `yarn dev` to start the application and development server at localhost:3000

## scripts

- `yarn start` Starts the app in development mode
- `yarn test` Runs tests
- `yarn build` Builds applications for deployment (output can be found in `build` folder)
- `yarn test:e2e` Runs integration tests for cypress
