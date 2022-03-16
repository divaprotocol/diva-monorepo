/* global describe it before ethers */
// CHECK: What is the finalValue at the beginning? If it's set to 0, does it cause problems, i.e. could short position token holders benefit? -> No because the status is not set to confirmed
// CHECK: After diamond deployment, make sure that initial variables in diamond constructor or init function are set
// CHECK: Check whether you could initialized the diamond again after deployment (should not be allowed!)
// CHECK: claimFees function
// CHECK: transferEntitlement function

const {
  getSelectors,
  FacetCutAction,
  removeSelectors,
  findAddressPositionInFacets
} = require('../scripts/libraries/diamond.js')

const { deployDiamond } = require('../scripts/deploy.js')

const { assert } = require('chai')
const { ethers } = require('hardhat')

// TODO: Do tests where inflection = floor, inflection = cap

// Test ideas:
// Test where floor and inflection are extremely close to each other and check whether alpha/beta get out of the int256 range
// Test where floor=inflection=cap=0
// Test that any other user who uses the Position Token Factory to mint position tokens cannot redeem them 


describe('DiamondTest', async function () {
  let diamondAddress
  let diamondCutFacet
  let diamondLoupeFacet
  let ownershipFacet
  let governanceFacet
  let claimFacet
  let tx
  let receipt
  let result
  let poolId_ = null
  const addresses = []
  let ERC20CollateralToken, erc20CollateralToken
  let accounts
  let dataProvider
  let expiryTimeNow = Math.floor(Date.now()/1000-200) // offset by 200 sec to prevent Pool not yet expired error
  let expiryTimeFuture = 4078398480;
  let treasury;
  let fallbackDataProvider;

  before(async function () {
    accounts = await ethers.getSigners();
    contractOwner = accounts[0];
    dataProvider = accounts[2];
    treasury = "0x9926c12F4554d54A0E14E69acF56a870EcAdc41D";
    fallbackDataProvider = accounts[5];
    
    diamondAddress = await deployDiamond();
    diamondCutFacet = await ethers.getContractAt('DiamondCutFacet', diamondAddress) // First parameter indicates the file where the abi ist stored, second parameter is the address where the contract is deployed at
    diamondLoupeFacet = await ethers.getContractAt('DiamondLoupeFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
    liquidityFacet = await ethers.getContractAt('LiquidityFacet', diamondAddress)    
    settlementFacet = await ethers.getContractAt('SettlementFacet', diamondAddress)
    getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
    governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)
    claimFacet = await ethers.getContractAt('ClaimFacet', diamondAddress)

    
    // Note that diamondAddress = poolFacet.address = settlementFacet.address = ...

    // deploy ERC20CollateralToken for testing purposes
    ERC20CollateralToken = await ethers.getContractFactory('ERC20CollateralToken')
    erc20CollateralToken = await ERC20CollateralToken.connect(accounts[1]).deploy("DummyCollateralToken", "DCT")
    await erc20CollateralToken.deployed()
    console.log('ERC20CollateralToken deployed:', erc20CollateralToken.address)

  });

  /******************************************************/
  /****************** HELPER FUNCTIONS ******************/
  /******************************************************/

  // Mint 1 million dummy collateral tokens with 18 decimal places and send them to account 1
  async function mintCollateralToken(accountId = 1) {
      const tx = await erc20CollateralToken.connect(accounts[accountId]).mintPositionToken("1000000000000000000000000"); //100k with 18 decimals
      await tx.wait();
  };

  async function approveCollateralToken(accountId = 1) {
    const tx = await erc20CollateralToken.connect(accounts[accountId]).approve(poolFacet.address, "1000000000000000000000000");
    await tx.wait();
  };  

  // Input parameters (ordered):
  // referenceAsset
  // expiry time
  // floor: 1198.53
  // inflection: 1605.33
  // cap: 2001.17
  // collateral balance short: 10000.54 
  // collateral balance long: 5000.818
  // position token supply: 100.556
  // collateralToken
  // dataProvider
  async function createContingentPool(_expiryTime) {
    const tx = await poolFacet.connect(accounts[1]).createContingentPool(                                   
                                ["TeslaEth",
                                _expiryTime,
                                "1198530000000000000000",
                                "1605330000000000000000",
                                "2001170000000000000000",
                                "10000540000000000000000",
                                "5000818000000000000000",
                                "100556000000000000000",
                                erc20CollateralToken.address,
                                dataProvider.address,
                                0]
                                );
    await tx.wait();

    poolId_ = poolId_ + 1;
    console.log("poolId: " + poolId_);
    console.log("expiryTime: " + _expiryTime);
  };

  // Input parameters (ordered):
  // referenceAsset
  // expiry time
  // floor: 1600
  // inflection: 1600
  // cap: 1600
  // collateral balance short: 100 
  // collateral balance long: 100
  // position token supply: 100
  // collateralToken
  // dataProvider
  async function createContingentPool2(_expiryTime) {
    const tx = await poolFacet.connect(accounts[1]).createContingentPool(                                   
                                ["TeslaEth",
                                _expiryTime,
                                "1600000000000000000000",
                                "1600000000000000000000",
                                "1600000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                erc20CollateralToken.address,
                                dataProvider.address,
                                0]
                                );

    await tx.wait();                                
    
    poolId_ = poolId_ + 1;
    console.log("poolId: " + poolId_);
    console.log("expiryTime: " + _expiryTime);
  };

  // Input parameters (ordered):
  // referenceAsset
  // expiry time
  // floor: 1600
  // inflection: 1600
  // cap: 1800
  // collateral balance short: 100 
  // collateral balance long: 100
  // position token supply: 100
  // collateralToken
  // dataProvider
  async function createContingentPool3(_expiryTime) {
    const tx = await poolFacet.connect(accounts[1]).createContingentPool(                                   
                                ["TeslaEth",
                                _expiryTime,
                                "1600000000000000000000",
                                "1600000000000000000000",
                                "1800000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                erc20CollateralToken.address,
                                dataProvider.address,
                                0]
                                );
    await tx.wait();
    
    poolId_ = poolId_ + 1;
    console.log("poolId: " + poolId_);
    console.log("expiryTime: " + _expiryTime);
  };

  // Input parameters (ordered):
  // referenceAsset
  // expiry time
  // floor: 1400
  // inflection: 1600
  // cap: 1600
  // collateral balance short: 100 
  // collateral balance long: 100
  // position token supply: 100
  // collateralToken
  // dataProvider
  async function createContingentPool4(_expiryTime) {
    const tx = await poolFacet.connect(accounts[1]).createContingentPool(                                   
                                ["TeslaEth",
                                _expiryTime,
                                "1400000000000000000000",
                                "1600000000000000000000",
                                "1600000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                "100000000000000000000",
                                erc20CollateralToken.address,
                                dataProvider.address,
                                0]                                
                                );
    await tx.wait();
    
    poolId_ = poolId_ + 1;
    console.log("poolId: " + poolId_);
    console.log("expiryTime: " + _expiryTime);
  };

  // Pool with max capacity
  // Input parameters (ordered):
  // referenceAsset
  // expiry time
  // floor: 1198.53
  // inflection: 1605.33
  // cap: 2001.17
  // collateral balance short: 10000.54 
  // collateral balance long: 5000.818
  // position token supply: 100.556
  // collateralToken
  // dataProvider
  // capacity: 15001.358 (total collateral)
  async function createContingentPool5(_expiryTime) {
    const tx = await poolFacet.connect(accounts[1]).createContingentPool(                                   
                                ["TeslaEth",
                                _expiryTime,
                                "1198530000000000000000",
                                "1605330000000000000000",
                                "2001170000000000000000",
                                "10000540000000000000000",
                                "5000818000000000000000",
                                "100556000000000000000",
                                erc20CollateralToken.address,
                                dataProvider.address,
                                "15001358000000000000000"]
                                );
    await tx.wait();

    poolId_ = poolId_ + 1;
    console.log("poolId: " + poolId_);
    console.log("expiryTime: " + _expiryTime);
  };

  // date for long expired state where final reference value = strike: 1602400517
  // date for just expired state: Date.now()

  // final reference value: 1951.46
  async function setFinalReferenceValue(_poolId, _finalReferenceValue) {
    const tx = await settlementFacet.connect(dataProvider).setFinalReferenceValue(_poolId, _finalReferenceValue, 1); // allowChallenge parameter is set to 1 here
    await tx.wait();
  };

  async function setRedemptionAmount(_poolId) {
    // calculate redemption amount short token
    const tx = await settlementFacet.setRedemptionAmount(_poolId);
    await tx.wait();
  };


  async function challengeFinalReferenceValue(_poolId, _proposedFinalReferenceValue) {
    const tx = await settlementFacet.connect(accounts[1]).challengeFinalReferenceValue(_poolId, _proposedFinalReferenceValue);
    await tx.wait();
  } 

  /******************************************************/
  /****************** DIVA tests ************************/
  /******************************************************/

  it('deploys Diamond contract', async () => {
    assert(diamondAddress !== '');
  });

  it('initializes values at Diamond deployment', async () => {
    const governanceParameters = await getterFacet.getGovernanceParameters();
    assert(governanceParameters.redemptionFee.toString() === "2500000000000000")
    assert(governanceParameters.settlementFee.toString() === "500000000000000")
    assert(governanceParameters.submissionPeriod.toString() === (60*60*24).toString())
    assert(governanceParameters.challengePeriod.toString() === (60*60*24).toString())
    assert(governanceParameters.reviewPeriod.toString() === (60*60*24*2).toString())
    assert(governanceParameters.treasury.toString() === "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") // Address corresponds to second signer (see deploy script)
    assert(governanceParameters.fallbackDataProvider.toString() === contractOwner.address)
  });

  it('sets the fallback data provider', async () => {
    const governanceParametersBefore = await getterFacet.getGovernanceParameters();
    assert(governanceParametersBefore.fallbackDataProvider.toString() === contractOwner.address);

    await governanceFacet.setFallbackDataProvider(fallbackDataProvider.address);

    const governanceParametersAfter = await getterFacet.getGovernanceParameters();
    assert(governanceParametersAfter.fallbackDataProvider.toString() === fallbackDataProvider.address);
  })

  it('deploys ERC20CollateralToken contract', async () => { // for testing purposes only
    assert(erc20CollateralToken.address !== '');
  });
  
  it('sends collateral token to account 1', async () => {
    await mintCollateralToken();
    const balance = await erc20CollateralToken.balanceOf(accounts[1].address);
    assert(balance.toString() === "1000000000000000000000000");
  });

  it('allows Pool contract to spend collateral ', async () => {
    await mintCollateralToken();
    await approveCollateralToken();
    const allowance =  await erc20CollateralToken.allowance(accounts[1].address, poolFacet.address);
    assert(allowance.toString() === "1000000000000000000000000");
  });

  /////////////////////////////////////////////////////////////////////////
  ///////////////// DIVA Facet Tests ////////////////////////////////////// 
  /////////////////////////////////////////////////////////////////////////

  it('creates a contingent pool (long expired, final reference value = strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool with expiry time far in the past (so that final reference value = strike)
      await createContingentPool(1602400517);
    
      // Check if DIVA received the collateral token 
      const balanceCollateral = await erc20CollateralToken.balanceOf(poolFacet.address);
      assert(balanceCollateral.toString() === "15001358000000000000000");

      // Check if pool parameters are stored correctly
      const issuedPool = await getterFacet.getPoolParameters(poolId_);
      assert(issuedPool.referenceAsset === "TeslaEth");
      assert(issuedPool.expiryTime.toString() === "1602400517");
      assert(issuedPool.inflection.toString() === "1605330000000000000000");
      assert(issuedPool.floor.toString() === "1198530000000000000000");
      assert(issuedPool.cap.toString() === "2001170000000000000000");
      assert(issuedPool.supplyInitial.toString() === "100556000000000000000"); 
      assert(issuedPool.collateralToken === erc20CollateralToken.address);
      assert(issuedPool.collateralBalanceShortInitial.toString() === "10000540000000000000000");
      assert(issuedPool.collateralBalanceLongInitial.toString() === "5000818000000000000000");
      assert(issuedPool.collateralBalance.toString() === "15001358000000000000000");
      assert(issuedPool.finalReferenceValue.toString() === "0");
      assert(issuedPool.statusFinalReferenceValue.toString() === "0"); // 0 = Open, 1 = Submitted, 2 = Challenged, 3 = Confirmed
      assert(issuedPool.redemptionAmountLongToken.toString() === "0");
      assert(issuedPool.redemptionAmountShortToken.toString() === "0");
      assert(issuedPool.statusTimestamp.toString() !== "0" );
      assert(issuedPool.dataProvider.toString() === dataProvider.address.toString());
      assert(issuedPool.redemptionFee.toString() === "2500000000000000");
      assert(issuedPool.settlementFee.toString() === "500000000000000");

      // Check if short token was sent to pool creator
      const shortToken = await ethers.getContractAt('PositionToken', issuedPool.shortToken)
      const balanceShortToken = await shortToken.balanceOf(accounts[1].address);
      assert(balanceShortToken.toString() === "100556000000000000000");

      // Check if long token was sent to pool creator
      const longToken = await ethers.getContractAt('PositionToken', issuedPool.longToken)
      const balancelongToken = await longToken.balanceOf(accounts[1].address);
      assert(balancelongToken.toString() === "100556000000000000000");
      });


    

    /******************************************************************************************************************************************************/
    /****************** Test set 2: recently expired contracts where final reference value is set by data provider and is not equal to strike ******************/
    /******************************************************************************************************************************************************/

    it('creates a contingent pool (recently expired, final reference value <> strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool with current time as expiry time
      await createContingentPool(expiryTimeNow);
      console.log("poolId_: " + poolId_);
      
      // Get collateral token balance of DIVA contract       
      const balanceCollateral = await erc20CollateralToken.balanceOf(poolFacet.address);

      // Check if pool parameters are stored correctly
      const issuedPool = await getterFacet.getPoolParameters(poolId_);      
      assert(issuedPool.referenceAsset === "TeslaEth");
      assert(issuedPool.expiryTime.toString() !== "0")
      assert(issuedPool.expiryTime.toString() === expiryTimeNow.toString());        
      assert(issuedPool.inflection.toString() === "1605330000000000000000");
      assert(issuedPool.floor.toString() === "1198530000000000000000");
      assert(issuedPool.cap.toString() === "2001170000000000000000");
      assert(issuedPool.supplyInitial.toString() === "100556000000000000000");
      assert(issuedPool.collateralToken === erc20CollateralToken.address);
      assert(issuedPool.collateralBalanceShortInitial.toString() === "10000540000000000000000");
      assert(issuedPool.collateralBalanceLongInitial.toString() === "5000818000000000000000");
      assert(issuedPool.collateralBalance.toString() === "15001358000000000000000");
      assert(issuedPool.finalReferenceValue.toString() === "0");
      assert(issuedPool.statusFinalReferenceValue.toString() === "0"); // 0 = Open, 1 = Submitted, 2 = Challenged, 3 = Confirmed
      assert(issuedPool.redemptionAmountLongToken.toString() === "0");
      assert(issuedPool.redemptionAmountShortToken.toString() === "0");
      assert(issuedPool.statusTimestamp.toString() !== "0" );
      assert(issuedPool.dataProvider.toString() === dataProvider.address.toString());
      assert(issuedPool.redemptionFee.toString() === "2500000000000000");
      assert(issuedPool.settlementFee.toString() === "500000000000000");

      // Check if short token was sent to pool creator
      const shortToken = await ethers.getContractAt('PositionToken', issuedPool.shortToken)
      const balanceShortToken = await shortToken.balanceOf(accounts[1].address);
      assert(balanceShortToken.toString() === "100556000000000000000");

      // Check if long token was sent to pool creator
      const longToken = await ethers.getContractAt('PositionToken', issuedPool.longToken)
      const balancelongToken = await longToken.balanceOf(accounts[1].address);
      assert(balancelongToken.toString() === "100556000000000000000");
      
    });

    it('increases the liquidity for an existing pool', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 sends the minted collateral tokens to account 3 so that he can add liquidity (cannot use mintCollateralToken from account 3 directly due to ownership restrictions)
      const tx1 = await erc20CollateralToken.connect(accounts[1]).transfer(accounts[3].address, "1000000000000000000000000");
      await tx1.wait();
      
      // Account 1 mints collateral tokens for himself
      await mintCollateralToken(); 

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(expiryTimeFuture);

      // Account 3 allows DIVA contract to spend collateral token before adding liquidity to the pool
      await approveCollateralToken(3);

      // Get the current collateral token balance of DIVA contract (have to work later with the change in collateral as DIVA's collateral token balance is not reset at the beginning of each test)
      const balanceCollateralBeforeInc = await erc20CollateralToken.balanceOf(poolFacet.address);

      // Account 3 adds liquidity
      const tx2 = await liquidityFacet.connect(accounts[3]).addLiquidity(poolId_, "5000000000000000000000");
      await tx2.wait();

      // New collateral token balance of DIVA contract
      const balanceCollateralAfterInc = await erc20CollateralToken.balanceOf(poolFacet.address);

      // Check if collateral was received by calculating the delta of collateral token balance before and after addition of liquidity 
      const diffCollateralBalance = BigInt(balanceCollateralAfterInc.toString()) - BigInt(balanceCollateralBeforeInc.toString());
      console.log("Difference balanceCollateral " + diffCollateralBalance);
      assert(diffCollateralBalance.toString() === "5000000000000000000000");
                                        
      // Check if collateral balance and position token supply parameter of the pool were updated
      const issuedPool = await getterFacet.getPoolParameters(poolId_); 
      const longToken = await ethers.getContractAt('PositionToken', issuedPool.longToken)
      const shortToken = await ethers.getContractAt('PositionToken', issuedPool.shortToken)

      assert(issuedPool.collateralBalance.toString() === "20001358000000000000000"); // 13333751566579505668753 + 6667606433420494331247
      assert((await longToken.totalSupply()).toString() === "134071632384748100805");
      assert((await shortToken.totalSupply()).toString() === "134071632384748100805");
      

      // Check if account 3 received position tokens
      const balanceLongToken = await longToken.balanceOf(accounts[3].address);
      const balanceShortToken = await shortToken.balanceOf(accounts[3].address);
      assert(balanceLongToken.toString() === "33515632384748100805"); 
      assert(balanceShortToken.toString() === "33515632384748100805");

    });

    it('reverts when additional liquidity exceeds remaining pool capacity', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 sends the minted collateral tokens to account 3 so that he can add liquidity (cannot use mintCollateralToken from account 3 directly due to ownership restrictions)
      const tx1 = await erc20CollateralToken.connect(accounts[1]).transfer(accounts[3].address, "1000000000000000000000000");
      await tx1.wait();
      
      // Account 1 mints collateral tokens for himself
      await mintCollateralToken(); 

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool5(expiryTimeFuture);

      // Account 3 allows DIVA contract to spend collateral token before adding liquidity to the pool
      await approveCollateralToken(3);

      // Get the current collateral token balance of DIVA contract (have to work later with the change in collateral as DIVA's collateral token balance is not reset at the beginning of each test)
      const poolParams = await getterFacet.getPoolParameters(poolId_);
      const currentCollateralBalance = BigInt(poolParams.collateralBalance.toString());
      assert(currentCollateralBalance.toString() === "15001358000000000000000");
      
      try {
        // Account 3 adds liquidity
      const tx2 = await liquidityFacet.connect(accounts[3]).addLiquidity(poolId_, "1");
      await tx2.wait();
      assert(false);
      } catch(e) {
        assert(e);
      }

    });

    it('removes liquidity in two steps down to zero, claims fees, adds back liquidity', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 sends the minted collateral tokens to account 4 so that he can add liquidity (cannot use mintCollateralToken from account 4 directly due to ownership restrictions)
      await erc20CollateralToken.connect(accounts[1]).transfer(accounts[4].address, "1000000000000000000000000"); // 1'000'000
      
      // Account 1 mints collateral tokens for himself
      await mintCollateralToken(); 
      
      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(expiryTimeFuture);

      // Get the parameters of the currently created contingent pool
      const issuedPool = await getterFacet.getPoolParameters(poolId_);
      
      // Account 1 sends all short position tokens to account 4
      const shortToken = await ethers.getContractAt('PositionToken', issuedPool.shortToken)
      const tx2 = await shortToken.connect(accounts[1]).transfer(accounts[4].address, "100556000000000000000"); // 100.556    
      await tx2.wait();       
      const balanceShortToken = await shortToken.balanceOf(accounts[4].address);
      assert(balanceShortToken.toString() === "100556000000000000000");
      
      // Account 1 sends all long position tokens to account 4 
      const longToken = await ethers.getContractAt('PositionToken', issuedPool.longToken)
      const tx1 = await longToken.connect(accounts[1]).transfer(accounts[4].address, "100556000000000000000"); // 100.556
      await tx1.wait();
      const balanceLongToken = await longToken.balanceOf(accounts[4].address);
      assert(balanceLongToken.toString() === "100556000000000000000"); 

      // Get DIVA contract collateral token balance before liquidity is removed
      const balanceCollateralBefore = await erc20CollateralToken.balanceOf(poolFacet.address);
      console.log("balanceCollateralBefore: " + balanceCollateralBefore.toString());

      // Get the current owner of DIVA contract which should be equal to accounts[0] (set at the beginning of the test)
      const currentDiamondOwner = await ownershipFacet.owner();
      assert(currentDiamondOwner.toString() === accounts[0].address.toString());
      
      // Get current treasury address (hard-coded in the diamond constructor)
      const currentTreasuryAddress = (await getterFacet.getGovernanceParameters()).treasury;
      console.log("Current treasury address: " + currentTreasuryAddress); 
      
      // Change treasury address for testing purposes, so that we can use a Signer object to connect to contracts and execute functions
      await governanceFacet.setTreasuryAddress(accounts[0].address);
      const newTreasuryAddress = (await getterFacet.getGovernanceParameters()).treasury;
      assert(newTreasuryAddress.toString() === accounts[0].address.toString())

      // Account 4 removes liquidity by giving back 66.698111597630027894 long tokens prior to pool expiration. Required short token amount is calculated within the contract function: 33.515632384748100804
      // Note: Python will output 33.515632384748100805 as the required short token amount as we have 49 at the end, but solidity truncates resulting in a 4 at the end
      const tx3 = await liquidityFacet.connect(accounts[4]).removeLiquidity(poolId_, "66698111597630027894");
      await tx3.wait();
      
      // Check if the short and long position token supply is correctly reflected in the pool parameters
      const issuedPoolAfterRemoveLiquidity = await getterFacet.getPoolParameters(poolId_);
      assert((await longToken.totalSupply()).toString() === "33857888402369972106");
      assert((await shortToken.totalSupply()).toString() === "33857888402369972106");

      // Check if the correct collateral amount was removed from DIVA contract (fee is still inside the diamond contract as it was not yet claimed)
      const balanceCollateralAfter = await erc20CollateralToken.balanceOf(poolFacet.address);
      const diffCollateralBalance = BigInt(balanceCollateralBefore.toString())-BigInt(balanceCollateralAfter.toString());
      assert(diffCollateralBalance.toString() === "9920447941942798042761");  // 9920.447941942798042761  
      
      // Check if account 4's short token balance has reduced accordingly
      const shortTokenAfterRemoveLiquidity = await ethers.getContractAt('PositionToken', issuedPoolAfterRemoveLiquidity.shortToken)
      const balanceShortTokenAfterRemoveLiquidity = await shortTokenAfterRemoveLiquidity.balanceOf(accounts[4].address);
      assert(balanceShortTokenAfterRemoveLiquidity.toString() === "33857888402369972106"); 

      // Check if account 4's long token balance has reduced accordingly
      const longTokenAfterRemoveLiquidity = await ethers.getContractAt('PositionToken', issuedPoolAfterRemoveLiquidity.longToken)
      const balanceLongTokenAfterRemoveLiquidity = await longTokenAfterRemoveLiquidity.balanceOf(accounts[4].address);      
      assert(balanceLongTokenAfterRemoveLiquidity.toString() === "33857888402369972106"); 
     
      // Check if the correct fee amounts have been allocated to DIVA treasury and data provider
      const collateralTokenAddress = await erc20CollateralToken.address;
      const claimableFeeAmountDIVATreasury = await getterFacet.getClaims(collateralTokenAddress, newTreasuryAddress);
      const claimableFeeAmountDataProvider = await getterFacet.getClaims(collateralTokenAddress, dataProvider.address);
      assert(claimableFeeAmountDIVATreasury.toString() === "24875747096145431401") // 24.875747096145431401 
      assert(claimableFeeAmountDataProvider.toString() === "4975149419229086280") // 4.975149419229086280 
      
      // DIVA treasury claims their fees (note that accounts[0] was set as the treasury address in this test)
      const tx4 = await claimFacet.connect(accounts[0]).claimFees(collateralTokenAddress);
      await tx4.wait();

      // Data provider claims their fees
      const tx5 = await claimFacet.connect(dataProvider).claimFees(collateralTokenAddress);
      await tx5.wait();

      // Check if claimable fee amounts have been set to zero after fee have been claimed
      const claimableFeeAmountDIVATreasuryAfterClaim = await getterFacet.getClaims(collateralTokenAddress, accounts[0].address);
      const claimableFeeAmountDataProviderAfterClaim = await getterFacet.getClaims(collateralTokenAddress, dataProvider.address);
      assert(claimableFeeAmountDIVATreasuryAfterClaim.toString() === "0");
      assert(claimableFeeAmountDataProviderAfterClaim.toString() === "0");

      // Check if the correct overall collateral amount (incl. fees) has been removed from DIVA contract
      const balanceCollateralAfterClaim = await erc20CollateralToken.balanceOf(poolFacet.address);
      const diffCollateralBalanceAfterClaim = BigInt(balanceCollateralBefore.toString())-BigInt(balanceCollateralAfterClaim.toString());
      assert(diffCollateralBalanceAfterClaim.toString() === "9950298838458172560442");  // 9950.2988384581725604427 

      // Check that the data provider isn't allowed to claim a fee when claim amount is zero
      try {
        const tx6 = await claimFacet.connect(accounts[0]).claimFees(collateralTokenAddress);
        await tx6.wait();

        const tx7 = await claimFacet.connect(dataProvider).claimFees(collateralTokenAddress);
        await tx7.wait();
        assert(false);
      } catch(e) {
          assert(e);
      }           
        
      // Account 4 removes all remaining collateral in the pool by sending back all his remaining long tokens
      const tx8 = await liquidityFacet.connect(accounts[4]).removeLiquidity(poolId_, "33857888402369972106"); // 33.857888402369972106
      await tx8.wait();
      
      // Check if the short and long position token supply of the pool went to zero
      const issuedPoolAfterSecondRemoveLiquidity = await getterFacet.getPoolParameters(poolId_);
      assert((await longToken.totalSupply()).toString() === "0");
      assert((await shortToken.totalSupply()).toString() === "0");
      
      // DIVA treasury claims their fees (note that accounts[0] was set as the treasury address in this test)
      const tx9 = await claimFacet.connect(accounts[0]).claimFees(collateralTokenAddress);
      await tx9.wait();

      // Data provider claims their fees
      const tx10 = await claimFacet.connect(dataProvider).claimFees(collateralTokenAddress);
      await tx10.wait();

      // Check if collateral token balance of divaFactory went down to zero (had to work with the change in collateral as DIVA's collateral token balance is not reset at the beginning of each test) 
      const balanceCollateralAfterSecondClaim = await erc20CollateralToken.balanceOf(poolFacet.address);
      const diffCollateralBalanceAfterSecondClaim = BigInt(balanceCollateralBefore.toString()) - BigInt(balanceCollateralAfterSecondClaim.toString());
      assert(diffCollateralBalanceAfterSecondClaim.toString() === "15001358000000000000000");
      
      // Given that all collateral was removed from the pool, check if someone can add back collateral 
      // Account 4 sets allowance for divaFactory to spend collateral token
      await approveCollateralToken(4);

      // Account 4 adds collateral
      const tx11 = await liquidityFacet.connect(accounts[4]).addLiquidity(poolId_, "15001358000000000000000");
      await tx11.wait();

      // Check if position token supply and collateral balances after collateral addition are correct
      const issuedPoolAfterAddLiquidity = await getterFacet.getPoolParameters(poolId_); 
      assert((await longToken.totalSupply()).toString() === "100556000000000000000");
      assert((await shortToken.totalSupply()).toString() === "100556000000000000000");
      assert(issuedPoolAfterAddLiquidity.collateralBalance.toString() === "15001358000000000000000");

    });

    /////////////////////////////////////////////////////////////////////////
    /////////// Settlement Facet Tests ////////////////////////////////////// 
    /////////////////////////////////////////////////////////////////////////

    it('sets final reference value (scenario final reference value = strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(1602400517);
      console.log("optionId_: " + poolId_);

      // Data provider (account 2) sets the final reference asset value
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // It doesn't matter what you set here as time has already expired of this contract and final reference value is equal to the strike
      const pool = await getterFacet.getPoolParameters(poolId_);
      assert(pool.finalReferenceValue.toString() === "1605330000000000000000");
    });


    it('sets redemption amount (scenario final reference value = strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(1602400517);

      // Data provider (account 2) sets the final reference asset value
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // it doesn't matter what value you set here as the pool is already expired

      const pool = await getterFacet.getPoolParameters(poolId_);
      assert(pool.redemptionAmountShortToken.toString() === "99154087075858228250"); // DAI 99.154087075858228250 payoff per short token (net of fees) at final reference value = strike reference value
      assert(pool.redemptionAmountLongToken.toString() === "49582476888499940331"); // DAI 49.582476888499940331 payoff per long token (net of fees) at final reference value = strike reference value
    });

    it('redeem direction token (final reference value = strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(1602400517);

      // Data provider (account 2) sets the final reference asset value
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // it doesn't matter what value you set here as the pool is already expired

      // Get pool parameters
      const issuedPool = await getterFacet.getPoolParameters(poolId_);
      const shortTokenAddress = issuedPool.shortToken;
      const longTokenAddress = issuedPool.longToken;

      // Get collateral token balance of account 1 before redemption (have to work later with the change in collateral as DIVA's collateral token balance is not reset at the beginning of each test) 
      const collateralTokenBalanceBeforeRedemption = await erc20CollateralToken.balanceOf(accounts[1].address);

      // Account 1 redeems short token
      const shortToken = await ethers.getContractAt('PositionToken', shortTokenAddress)
      const tx1 = await settlementFacet.connect(accounts[1]).redeemPositionToken(shortTokenAddress, "13000000000000000000"); // 13 tokens assuming 18 decimal precision
      await tx1.wait();
      const balanceShortToken = await shortToken.balanceOf(accounts[1].address);

      // Check if account 1's short token balance decreased        
      assert(balanceShortToken.toString() === "87556000000000000000"); //100556000000000000000- 13000000000000000000

      // Check if collateral was returned to account 1 by looking at the delta as the collateral balance is not reset at the beginning of each test
      const actualCollateralTokenBalanceAfterRedemption1 = await erc20CollateralToken.balanceOf(accounts[1].address);
      //TODO: assert for delta console.log(BigInt(actualCollateralTokenBalanceAfterRedemption1) - BigInt(collateralTokenBalanceBeforeRedemption))

      // Get collateral token balance of DIVA contract BEFORE token redemption
      const divaFactoryTokenBalanceBeforeRedemption = await erc20CollateralToken.balanceOf(poolFacet.address);
      
      const expectedCollateralTokenBalanceAfterRedemption1 = BigInt(collateralTokenBalanceBeforeRedemption.toString()) + BigInt("1289003131986156967250");

      console.log("Actual collateral token balance after redemption Account 1: " + actualCollateralTokenBalanceAfterRedemption1.toString());
      console.log("Expected collateral token balance after redemption Account 1: " + expectedCollateralTokenBalanceAfterRedemption1.toString());
      assert(actualCollateralTokenBalanceAfterRedemption1.toString() === expectedCollateralTokenBalanceAfterRedemption1.toString()); // 13 short token redeemd * DAI 99.154087075858228250 per short token
      

      // Account 1 redeems long token
      const longToken = await ethers.getContractAt('PositionToken', longTokenAddress)
      const tx2 = await settlementFacet.connect(accounts[1]).redeemPositionToken(longTokenAddress, "7000000000000000000"); // 7 tokens assuming 18 decimal precision
      await tx2.wait();
      const balanceLongToken = await longToken.balanceOf(accounts[1].address);

      // Check if account 1's long token balance decreased        
      assert(balanceLongToken.toString() === "93556000000000000000");

      // Check if collateral was returned to account 1 by looking at the delta as the collateral balance is not reset at the beginning of each test
      const actualCollateralTokenBalanceAfterRedemption2 = await erc20CollateralToken.balanceOf(accounts[1].address);
      //TODO: assert for delta console.log(BigInt(actualCollateralTokenBalanceAfterRedemption1) - BigInt(collateralTokenBalanceBeforeRedemption))
      
      const expectedCollateralBalanceAfterRedemption2 = BigInt(expectedCollateralTokenBalanceAfterRedemption1.toString()) + BigInt("347077338219499582317")  // I have to add also amount redeemd from short tokens here

      console.log("Collateral token balance after long token redemption Account 1: " + actualCollateralTokenBalanceAfterRedemption2.toString());
      assert(actualCollateralTokenBalanceAfterRedemption2.toString() === expectedCollateralBalanceAfterRedemption2.toString()); // 7 long token redeemd * DAI 49.582476888499940331 per short token
      
      // check collateral tokne balance of diva contract AFTER token redemption
      const divaFactoryTokenBalanceAfterRedemption = await erc20CollateralToken.balanceOf(poolFacet.address);
      console.log("divaFactoryTokenBalanceAfterRedemption: " + divaFactoryTokenBalanceAfterRedemption);

      //TODO test if ERC20 collateral token has less than 18 decimals
    });

    /******************************************************************************************************************************************************/
    /****************** Test set 2: recently expired contracts where final reference value is set by data provider and is not equal to strike ******************/
    /******************************************************************************************************************************************************/

    it('set final reference value (recently expired pool, final reference value <> strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(expiryTimeNow);
      console.log("poolId_: " + poolId_);

      // Data provider (account 2) sets the final reference asset value      
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // Here the final reference value matters as the pool just recently expired (i.e. fallback to strike is not applied here)

      const pool = await getterFacet.getPoolParameters(poolId_);
      console.log("statusFinalReferenceValue: " + pool.statusFinalReferenceValue.toString());
      console.log("Final reference value of optionId_ " + poolId_ + " is " + pool.finalReferenceValue.toString());
      assert(pool.finalReferenceValue.toString() === "1951460000000000000000");
    });

    it('set redemption amount (scenario final reference value <> strike)', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(expiryTimeNow);

      // Data provider (account 2) sets the final reference asset value      
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // here it matteers what final reference value you set here as the pool just recently expired and final reference value <> strike
      console.log("Proposal for final reference value submitted");
      
      // Final reference value is challenged
      await challengeFinalReferenceValue(poolId_, "123");
      console.log("Final reference value challenged by user")

      // Check if statusFinalReferenceValue in pool struct was correctly updated after challenge
      const poolAfterChallenge = await getterFacet.getPoolParameters(poolId_);
      console.log("statusFinalReferenceValue after challenge: " + poolAfterChallenge.statusFinalReferenceValue.toString())
      assert(poolAfterChallenge.statusFinalReferenceValue.toString() === "2"); // 2 = Challenged
      

      // data provider submits the same reference value and hence confirms it (had to do it that way, otherwise setRedemptionAmount (next function), which requires status to be confirmed, wouldn't work)
      await setFinalReferenceValue(poolId_, "1951460000000000000000");
      console.log("Same final reference value re-submitted and confirmed by data provider");      
      const poolAfterConfirmation = await getterFacet.getPoolParameters(poolId_);
      console.log("Status in pool struct after re-submission of same value by data provider: " + poolAfterConfirmation.statusFinalReferenceValue.toString())
      assert(poolAfterConfirmation.statusFinalReferenceValue.toString() === "3"); // 3 = Confirmed

      // calculate redemption amount short token (status of final reference value needs to be at confirmed stage first)
      // await setRedemptionAmount(optionId_);

      // get updated pool struct
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      
      // TODO adjust for float number
      console.log("redemptionAmountShortToken " + poolAfterSetRedemption.redemptionAmountShortToken.toString());
      console.log("redemptionAmountLongToken " + poolAfterSetRedemption.redemptionAmountLongToken.toString());
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "12451873657389128249"); // (5000.818+10000.54 - (5000.818+10000.54*(1951.46-1605.33)/(2001.17-1605.33)))/100.556*(1-0.003)
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "136284690306969040332");  // (5000.818+10000.54*(1951.46-1605.33)/(2001.17-1605.33))/100.556*(1-0.003)
      
    });


    it('fails to set redemption amount before the end of the challenge period', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // Account 1 allows DIVA contract to spend collateral token
      await approveCollateralToken();

      // Account 1 creates a contingent pool 
      await createContingentPool(expiryTimeNow);

      // set redemption reference value
      await setFinalReferenceValue(poolId_, "1951460000000000000000"); // here it matteers what final reference value you  set here as the pool just recently expired and final reference value <> strike

      // calculate redemption amount short token (status of final reference value needs to be at confirmed stage first)
      try {
          await setRedemptionAmount(poolId_);
      } catch(e) {
          //assert(e.message.includes('status is not set to confirmed'));
          assert(e);
          return;
      }           
          assert(false);
    });




    /******************************************************************************************************************************************************/
    /************************************************* Test set 3 (Floor = Inflection = Cap) **************************************************************/
    /******************************************************************************************************************************************************/ 
    /* 
     * Scenario 1: 
     * Floor = Inflection = Cap
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value = Inflection 
     */ 
    it('set redemption amount (floor = inflection = cap, final reference value = inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool2(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1600000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1600000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "997000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "997000000000000000");  
    });

    /* 
     * Scenario 2: 
     * Floor = Inflection = Cap
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value < Inflection 
     */ 
    it('set redemption amount (floor = inflection = cap, final reference value < inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool2(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1590000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1590000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "1994000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "0");  
    });

    /* 
     * Scenario 3: 
     * Floor = Inflection = Cap
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value > Inflection 
     */ 
    it('set redemption amount (floor = inflection = cap, final reference value > inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool2(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1610000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1610000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "0"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "1994000000000000000");  
    });

    
    /******************************************************************************************************************************************************/
    /************************************************* Test set 4 (Floor = Inflection < Cap) **************************************************************/
    /******************************************************************************************************************************************************/ 
    /* 
     * Scenario 1: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value < Inflection 
     */ 
    it('set redemption amount (floor = inflection < cap, final reference value < inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool3(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1590000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1590000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "1994000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "0");  
    });

    /* 
     * Scenario 2: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value = Inflection 
     */ 
    it('set redemption amount (floor = inflection < cap, final reference value = inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool3(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1600000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1600000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "997000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "997000000000000000");  
    });

    /* 
     * Scenario 3: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Cap > Final reference value > inflection 
     */ 
    it('set redemption amount (floor = inflection < cap, cap > final reference value > inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool3(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1700000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1700000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "498500000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "1495500000000000000");  
    });

    /* 
     * Scenario 4: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value = Cap 
     */ 
    it('set redemption amount (floor = inflection < cap, final reference value = cap)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool3(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1800000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1800000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "0"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "1994000000000000000");  
    });
    
    /* 
     * Scenario 5: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value > Cap 
     */ 
    it('set redemption amount (floor = inflection < cap, final reference value > cap)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool3(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1810000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1810000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "0"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "1994000000000000000");  
    });

    /******************************************************************************************************************************************************/
    /************************************************* Test set 5 (Floor < Inflection = Cap) **************************************************************/
    /******************************************************************************************************************************************************/ 
    /* 
     * Scenario 1: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value > Cap 
     */ 
    it('set redemption amount (floor < inflection = cap, final reference value > cap)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool4(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1610000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1610000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "0"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "1994000000000000000");  
    });
    /* 
    * Scenario 2: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value = Inflection 
     */ 
    it('set redemption amount (floor < inflection = cap, final reference value = inflection = cap)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool4(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1600000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1600000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "997000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "997000000000000000");  
    });

    /* 
     * Scenario 3: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Floor < Final reference value < Inflection 
     */ 
    it('set redemption amount (floor < inflection = cap, floor < final reference value < inflection)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool4(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1500000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1500000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "1495500000000000000");
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "498500000000000000");  
    });

    /* 
     * Scenario 4: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value = Floor 
     */ 
    it('set redemption amount (floor < inflection = cap, final reference value = floor)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool4(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1400000000000000000000"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1400000000000000000000");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "1994000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "0");  
    });
    
    /* 
     * Scenario 5: 
     * Pool recently expired (i.e. we are still within the submission period) 
     * Final reference value < Floor 
     */ 
    it('set redemption amount (floor < inflection = cap, final reference value < floor)', async () => {
      await mintCollateralToken();
      await approveCollateralToken();
      await createContingentPool4(expiryTimeNow);
      await setFinalReferenceValue(poolId_, "1"); 
      await challengeFinalReferenceValue(poolId_, "123");
      await setFinalReferenceValue(poolId_, "1");
      const poolAfterSetRedemption = await getterFacet.getPoolParameters(poolId_);
      assert(poolAfterSetRedemption.redemptionAmountShortToken.toString() === "1994000000000000000"); 
      assert(poolAfterSetRedemption.redemptionAmountLongToken.toString() === "0");  
    });


    /////////////////////////////////////////////////////////////////////////
    //////////////////// Helper Facet Tests ///////////////////////////////// 
    /////////////////////////////////////////////////////////////////////////

    it('gets all pool parameters for given position token address', async () => {
          
      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // allow divaFactory to spend collateral token
      await approveCollateralToken();

      // Create contingent pool
      await createContingentPool(1602400517);
      
      const issuedPool = await getterFacet.getPoolParameters(poolId_);
      const shortTokenAddress =  issuedPool.shortToken;
      const optionParametersArray = await getterFacet.getPoolParametersByAddress(shortTokenAddress);
      //console.log(optionParametersArray);
      assert(optionParametersArray.referenceAsset === 'TeslaEth');
      
    });

    it('should return diamond address as the owner of the position tokens', async () => {

      // Account 1 mints collateral tokens
      await mintCollateralToken();

      // allow divaFactory to spend collateral token
      await approveCollateralToken();

      // Create contingent pool
      await createContingentPool(1602400517);

      const poolId = await getterFacet.getLatestPoolId();
      const optionParameters = await getterFacet.getPoolParameters(poolId);
      let positionTokenContract = await ethers.getContractAt('PositionToken', optionParameters.shortToken);
      const owner = await positionTokenContract.owner();
      assert(diamondAddress === owner);


    });

    /////////////////////////////////////////////////////////////////////////
    //////////////////// Diamond Tests ////////////////////////////////////// 
    /////////////////////////////////////////////////////////////////////////

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
