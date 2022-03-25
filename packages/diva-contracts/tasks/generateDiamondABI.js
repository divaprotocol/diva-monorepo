const fs = require("fs");
const { task } = require("hardhat/config");
const { execSync } = require("child_process");
const ERC20 = require("@openzeppelin/contracts/build/contracts/ERC20.json");

const basePath = "/contracts/facets/";
const libraryBasePath = "/contracts/libraries/";

task(
  "diamondABI",
  "Generates ABI file for diamond, includes all ABIs of facets"
).setAction(async () => {
  let files = fs.readdirSync("." + basePath);
  let abi = [];
  for (const file of files) {
    const jsonFile = file.replace("sol", "json");
    let json = fs.readFileSync(`./artifacts/${basePath}${file}/${jsonFile}`);
    json = JSON.parse(json);
    abi.push(...json.abi);
  }
  files = fs.readdirSync("." + libraryBasePath);
  for (const file of files) {
    const jsonFile = file.replace("sol", "json");
    let json = fs.readFileSync(
      `./artifacts/${libraryBasePath}${file}/${jsonFile}`
    );
    json = JSON.parse(json);
    json.abi.forEach(v => {
      const ids = json.abi.map(a => a.name + v.type)
      if (!ids.includes(v.name + v.type)) {
        abi.push(v)
      }
    })
  }
  let finalAbi = JSON.stringify(abi);
  fs.writeFileSync("./abis/diamond.json", finalAbi);

  console.info("Diamond ABI written to abis/diamond.json");

  execSync(
    "cp ./artifacts/contracts/PositionToken.sol/PositionToken.json ./abis/position-token.json"
  );

  console.info("PositionToken ABI written to ./abis/position-token.json");

  fs.writeFileSync("./abis/erc20.json", JSON.stringify(ERC20.abi));

  console.info("ERC20 ABI written to ./abis/erc20.json");
});