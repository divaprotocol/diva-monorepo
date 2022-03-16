/* global ethers */
/* eslint prefer-const: "off" */


const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  const [contractOwner, treasury] = await ethers.getSigners()
  console.log("contract owner address: " + contractOwner.address)
  console.log("treasury address: " + treasury.address)
  
  // Deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // Deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address, treasury.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  // Deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'PoolFacet',
    'LiquidityFacet',
    'GetterFacet',
    'SettlementFacet',
    'GovernanceFacet',
    'ClaimFacet'
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${facet.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // Upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt

  // Call to diamondCut function. No init function used as initialization of state variables is done in the diamond constructor
  tx = await diamondCut.diamondCut(cut, ethers.constants.AddressZero, '0x') 
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')
  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond
