/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')

const files = fs.readdirSync('./public/images/coin-logos')

fs.writeFileSync('./src/Util/localCoinImages.json', JSON.stringify(files))
