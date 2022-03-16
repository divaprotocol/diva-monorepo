const fs = require("fs");
const { task } = require("hardhat/config");

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
    abi.push(...json.abi);
  }
  let finalAbi = JSON.stringify(abi);
  fs.writeFileSync("./abis/diamond.json", finalAbi);
  console.log("ABI written to abi/diamond.json");
});