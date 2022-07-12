# Divaprotocol Discord Bod

## Nodes

make sure that applicatikon.commands+bot is ticked by url invite create

invite link:
https://discord.com/api/oauth2/authorize?client_id=960213520836862073&permissions=1644905889015&scope=bot%20applications.commands

start bot in powershell via:
- cd packages/diva-discord
- yarn hardhat run index.js --network ropsten

extract list of users
- node readData.js

test cases (each should be tested as / command and as message):

- register

  - already registerd ok
  - invalide address - ok
  - valid new user - ok

- address

  - not registered user - ok
  - registered user - ok

- claim

  - not registered user - ok
  - registerd user last claim more than 24h ago
  - registerd user last claim less than 24h ago - ok

- Queue

  - user cannot be added twice - ok
