const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert } = require('chai')
const { ethers } = require('hardhat')

describe('DiamondTest', async function () {
  let diamondAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet, poolFacet, liquidityFacet, settlementFacet, getterFacet, governanceFacet, claimFacet
  let tx
  let receipt
  let result
  const addresses = []

  before(async function () {
    
    diamondAddress = await deployDiamond();
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress) 
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
    liquidityFacet = await ethers.getContractAt('LiquidityFacet', diamondAddress)    
    settlementFacet = await ethers.getContractAt('SettlementFacet', diamondAddress)
    getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
    governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)
    claimFacet = await ethers.getContractAt('ClaimFacet', diamondAddress)

  });

    // ---------
    // All tests were already included in the Diamond Standard reference implementation and adjusted for the facets used in DIVA 
    // ---------

    it('should have nine facets -- call to facetAddresses function', async () => {
      for (const address of await diamondLoupeFacet.facetAddresses()) {
        addresses.push(address)
      }
  
      assert.equal(addresses.length, 9) // Test facets not included
    });

    it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
      let selectors = getSelectors(diamondCutFacet)
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0])
      assert.sameMembers(result, selectors)
      
      selectors = getSelectors(diamondLoupeFacet)
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1])
      assert.sameMembers(result, selectors)
      
      selectors = getSelectors(ownershipFacet)
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2])
      assert.sameMembers(result, selectors)
      
      selectors = getSelectors(poolFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
      assert.sameMembers(result, selectors)

      selectors = getSelectors(liquidityFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4])
      assert.sameMembers(result, selectors)

      selectors = getSelectors(getterFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[5])
      assert.sameMembers(result, selectors)

      selectors = getSelectors(settlementFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[6])
      assert.sameMembers(result, selectors)

      selectors = getSelectors(governanceFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[7])
      assert.sameMembers(result, selectors)

      selectors = getSelectors(claimFacet)    
      result = await diamondLoupeFacet.facetFunctionSelectors(addresses[8])
      assert.sameMembers(result, selectors)

    })

  it('should associate selectors with facets correctly -- multiple calls to facetAddress function', async () => {
    // Function selectors example contract: https://solidity-by-example.org/function-selector/
    assert.equal(
      addresses[0], // DiamondCutFacet
      await diamondLoupeFacet.facetAddress('0x1f931c1c') // bytes4(keccak256(bytes(diamondCut((address,uint8,bytes4[])[],address,bytes))))
    )
    assert.equal(
      addresses[1], // DiamondLoupeFacet
      await diamondLoupeFacet.facetAddress('0xcdffacc6')
    )
    assert.equal(
      addresses[1], // DiamondLoupeFacet
      await diamondLoupeFacet.facetAddress('0x01ffc9a7')
    )
    assert.equal(
      addresses[2], // OwnershipFacet
      await diamondLoupeFacet.facetAddress('0xf2fde38b')
    )
    assert.equal(
      addresses[3], // PoolFacet
      await diamondLoupeFacet.facetAddress('0xa642959d') // bytes4(keccak256(bytes(createContingentPool((string,uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address,uint256)))))
    )
    assert.equal(
      addresses[4], // LiquidityFacet
      await diamondLoupeFacet.facetAddress('0x9cd441da') // bytes4(keccak256(bytes(addLiquidity(uint256,uint256))))
    )
    assert.equal(
      addresses[5], // GetterFacet
      await diamondLoupeFacet.facetAddress('0x4a2fe84d') // bytes4(keccak256(bytes(getLatestPoolId())))
    )
    assert.equal(
      addresses[6], // SettlementFacet
      await diamondLoupeFacet.facetAddress('0x96cef196') // bytes4(keccak256(bytes(challengeFinalReferenceValue(uint256,uint256))))
    )
    assert.equal(
      addresses[7], // GovernanceFacet
      await diamondLoupeFacet.facetAddress('0x6605bfda') // bytes4(keccak256(bytes(setTreasuryAddress(address))))
    )
    assert.equal(
      addresses[8], // ClaimFacet
      await diamondLoupeFacet.facetAddress('0x15a0ea6a') // bytes4(keccak256(bytes(claimFees(address))))
    )
  })

  it('should add test1 functions', async () => {
    const Test1Facet = await ethers.getContractFactory('Test1Facet')
    const test1Facet = await Test1Facet.deploy()
    await test1Facet.deployed()
    addresses.push(test1Facet.address)
    const selectors = getSelectors(test1Facet).remove(['supportsInterface(bytes4)'])
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: test1Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(test1Facet.address)
    assert.sameMembers(result, selectors)
  })

  it('should test function call', async () => {
    const test1Facet = await ethers.getContractAt('Test1Facet', diamondAddress)
    await test1Facet.test1Func10()
  })

  it('should replace supportsInterface function', async () => {
    // Replacing a function means removing a function and adding a new function from a different facet but with the same function signature as the one removed
    const Test1Facet = await ethers.getContractFactory('Test1Facet')
    const selectors = getSelectors(Test1Facet).get(['supportsInterface(bytes4)'])
    const testFacetAddress = addresses[addresses.length - 1] // assumed to be the last element in array as added during the text
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: testFacetAddress,
        action: FacetCutAction.Replace,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(testFacetAddress)
    assert.sameMembers(result, getSelectors(Test1Facet))
  })

  it('should add test2 functions', async () => {
    const Test2Facet = await ethers.getContractFactory('Test2Facet')
    const test2Facet = await Test2Facet.deploy()
    await test2Facet.deployed()
    addresses.push(test2Facet.address)
    const selectors = getSelectors(test2Facet)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: test2Facet.address,
        action: FacetCutAction.Add,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(test2Facet.address)
    assert.sameMembers(result, selectors)
  })

  it('should remove some test2 functions', async () => {
    const test2Facet = await ethers.getContractAt('Test2Facet', diamondAddress)
    const functionsToKeep = ['test2Func1()', 'test2Func5()', 'test2Func6()', 'test2Func19()', 'test2Func20()']
    const selectors = getSelectors(test2Facet).remove(functionsToKeep)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[addresses.length - 1])
    assert.sameMembers(result, getSelectors(test2Facet).get(functionsToKeep))
  })

  it('should remove some test1 functions', async () => {
    const test1Facet = await ethers.getContractAt('Test1Facet', diamondAddress)
    const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()']
    const selectors = getSelectors(test1Facet).remove(functionsToKeep)
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    result = await diamondLoupeFacet.facetFunctionSelectors(addresses[addresses.length - 2])
    assert.sameMembers(result, getSelectors(test1Facet).get(functionsToKeep))
  })

  it('should remove all functions and facets except \'diamondCut\' and \'facets\'', async () => {
    let selectors = []
    let facets = await diamondLoupeFacet.facets()
    for (let i = 0; i < facets.length; i++) {
      selectors.push(...facets[i].functionSelectors)
    }
    selectors = removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)'])
    tx = await diamondCutFacet.diamondCut(
      [{
        facetAddress: ethers.constants.AddressZero,
        action: FacetCutAction.Remove,
        functionSelectors: selectors
      }],
      ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    facets = await diamondLoupeFacet.facets()
    assert.equal(facets.length, 2) // update?
    assert.equal(facets[0][0], addresses[0])
    assert.sameMembers(facets[0][1], ['0x1f931c1c'])
    assert.equal(facets[1][0], addresses[1])
    assert.sameMembers(facets[1][1], ['0x7a0ed627'])
  })

  it('should add most functions and facets', async () => {
    // Note that all functions except for diamondCut() and facets() function (in DiamondCutFacet and DiamondLoupeFacet) were removed in the previous test block
    // That's why adding previously existing functions is possible in this test
    const diamondLoupeFacetSelectors = getSelectors(diamondLoupeFacet).remove(['supportsInterface(bytes4)'])
    const Test1Facet = await ethers.getContractFactory('Test1Facet')
    const Test2Facet = await ethers.getContractFactory('Test2Facet')
    // Any number of functions from any number of facets can be added/replaced/removed in a
    // single transaction
    const cut = [
      {
        facetAddress: addresses[1], // DiamondLoupeFacet
        action: FacetCutAction.Add,
        functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
      },
      {
        facetAddress: addresses[2], // OwnershipFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(ownershipFacet)
      },
      {
        facetAddress: addresses[3], // PoolFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(poolFacet)
      },
      {
        facetAddress: addresses[4], // LiquidityFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(liquidityFacet)
      },
      {
        facetAddress: addresses[5], // GetterFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(getterFacet)
      },
      {
        facetAddress: addresses[6], // SettlementFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(settlementFacet)
      },
      {
        facetAddress: addresses[7], // GovernanceFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(governanceFacet)
      },
      {
        facetAddress: addresses[8], // ClaimFacet
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(claimFacet)
      },
      {
        facetAddress: addresses[addresses.length - 2], // TestFacet1 (added during tests)
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(Test1Facet)
      },
      {
        facetAddress: addresses[addresses.length - 1], // TestFacet2 (added during tests)
        action: FacetCutAction.Add,
        functionSelectors: getSelectors(Test2Facet)
      }
    ]
    tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
    receipt = await tx.wait()
    if (!receipt.status) {
      throw Error(`Diamond upgrade failed: ${tx.hash}`)
    }
    const facets = await diamondLoupeFacet.facets()
    const facetAddresses = await diamondLoupeFacet.facetAddresses()
    assert.equal(facetAddresses.length, 11) // 10 is including DiamondCutFacet and the two test facets
    assert.equal(facets.length, 11)
    assert.sameMembers(facetAddresses, addresses)
    assert.equal(facets[0][0], facetAddresses[0], 'first facet')
    assert.equal(facets[1][0], facetAddresses[1], 'second facet')
    assert.equal(facets[2][0], facetAddresses[2], 'third facet')
    assert.equal(facets[3][0], facetAddresses[3], 'fourth facet')
    assert.equal(facets[4][0], facetAddresses[4], 'fifth facet')
    assert.equal(facets[5][0], facetAddresses[5], 'sixth facet')
    assert.equal(facets[6][0], facetAddresses[6], 'seventh facet')
    assert.equal(facets[7][0], facetAddresses[7], 'eigth facet')
    assert.equal(facets[8][0], facetAddresses[8], 'ninth facet')
    assert.equal(facets[9][0], facetAddresses[9], 'tenth facet')
    assert.equal(facets[10][0], facetAddresses[10], 'eleventh facet')

    assert.sameMembers(facets[findAddressPositionInFacets(addresses[0], facets)][1], getSelectors(diamondCutFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[1], facets)][1], diamondLoupeFacetSelectors)
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[2], facets)][1], getSelectors(ownershipFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(poolFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[4], facets)][1], getSelectors(liquidityFacet))    
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[5], facets)][1], getSelectors(getterFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[6], facets)][1], getSelectors(settlementFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[7], facets)][1], getSelectors(governanceFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[8], facets)][1], getSelectors(claimFacet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[9], facets)][1], getSelectors(Test1Facet))
    assert.sameMembers(facets[findAddressPositionInFacets(addresses[10], facets)][1], getSelectors(Test2Facet))
  })
})
