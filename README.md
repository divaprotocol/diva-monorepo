# Divaprotocol Monorepo

## Prerequisites

First - make sure you installed all these

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/) - run `npm install -g yarn` to install yarn
- [Node version manager](https://github.com/nvm-sh/nvm)

Optional:

- Plugins for eslint and prettier for your ide (such as visual studio)

## Getting started

1. Run `yarn` in this repository to install all dependencies. 
2. Run `yarn dev` to start the application and development server at localhost:3000

This runs the application located at packages/diva-app.
To work on the app go there and make the changes you want.

## scripts

- `yarn dev` Starts the app in development mode
- `yarn test` Runs tests
- `yarn lint` Runs linter
- `yarn format` Runs prettier on all packages
- `yarn build` Builds packages for development

## Troubleshooting