const { poolIssuedEvent } = require('./events')

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deployDiamond } = require('../scripts/deploy.js')
const { erc20DeployFixture } = require("./fixtures/MockERC20Fixture")
const { positionTokenAttachFixture } = require("./fixtures/PositionTokenFixture")
const { parseEther, parseUnits } = require('@ethersproject/units')
const { getExpiryInSeconds, ONE_DAY } = require('./utils.js')

describe('PoolFacet', async function () {
  
  let diamondAddress
  let ownershipFacet, poolFacet, getterFacet
  let contractOwner, treasury, oracle, user1
  let inflection, cap, floor, collateralBalanceShort, collateralBalanceLong, expiryTime, supplyPositionToken, referenceAsset, collateralToken, dataProvider, capacity
  let redemptionFee = "2500000000000000" // initial protocol value
  let settlementFee = "500000000000000" // initial protocol value
  // -------
  // Input: Collateral token decimals (<= 18)
  // -------
  let decimals = 6

  before(async function () {
    [contractOwner, treasury, oracle, user1, ...accounts] = await ethers.getSigners(); // keep contractOwner and treasury at first two positions in line with deploy script
    
    // ---------
    // Setup: Deploy diamond contract (incl. facets) and connect to the diamond contract via facet specific ABI's
    // ---------
    diamondAddress = await deployDiamond();
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)
    poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
    getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
    governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)

  });

  describe('Initialization', async () => {
    it('Should initialize parameters at contract deployment', async () => {
      const governanceParameters = await getterFacet.getGovernanceParameters();
      expect(governanceParameters.redemptionFee).to.eq(redemptionFee);
      expect(governanceParameters.settlementFee).to.eq(settlementFee);
      expect(governanceParameters.submissionPeriod).to.eq(ONE_DAY);
      expect(governanceParameters.challengePeriod).to.eq(ONE_DAY);
      expect(governanceParameters.reviewPeriod).to.eq(2 * ONE_DAY);
      expect(governanceParameters.fallbackSubmissionPeriod).to.eq(5 * ONE_DAY);
      expect(governanceParameters.treasury).to.eq(treasury.address);
      expect(governanceParameters.fallbackDataProvider).to.eq(contractOwner.address);
      expect(await ownershipFacet.owner()).to.eq(contractOwner.address);
    })
  })

  describe('createContingentPool', async () => {
    let userStartCollateralTokenBalance;

    beforeEach(async function () {
        // ---------
        // Arrange: Equip user1 with collateral token, approve collateral token for diamond contract, and specify default pool parameters
        // ---------
        userStartCollateralTokenBalance = parseEther("1000000");
        collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", userStartCollateralTokenBalance, user1.address, decimals);   
        await collateralTokenInstance.connect(user1).approve(diamondAddress, userStartCollateralTokenBalance);
        // Specify default pool parameters
        referenceAsset = "BTC/USD"
        expiryTime = getExpiryInSeconds(7200) // Expiry in 2h
        floor = parseEther("1198.53")
        inflection = parseEther("1605.33")
        cap = parseEther("2001.17")
        collateralBalanceShort = parseUnits("10000.54", decimals)
        collateralBalanceLong = parseUnits("5000.818", decimals)
        supplyPositionToken = parseEther("100.556")
        collateralToken = collateralTokenInstance.address 
        dataProvider = oracle.address
        capacity = 0 // Uncapped

        if (
          this.currentTest?.title !==
          'Creates a contingent pool and stores the pool parameters'
        ) {
          // ---------
          // Act: Create contingent pool with default parameters
          // ---------
          await poolFacet.connect(user1).createContingentPool(
            [
              referenceAsset, 
              expiryTime, 
              floor,
              inflection, 
              cap,
              collateralBalanceShort, 
              collateralBalanceLong,  
              supplyPositionToken, 
              collateralToken, 
              dataProvider,
              capacity 
            ]
          );

          poolId = await getterFacet.getLatestPoolId();
          poolParams = await getterFacet.getPoolParameters(poolId);
          shortTokenInstance = await positionTokenAttachFixture(poolParams.shortToken);
          longTokenInstance = await positionTokenAttachFixture(poolParams.longToken);
    
        }
    })

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Creates a contingent pool and stores the pool parameters', async () => {      
      // ---------
      // Act: Create contingent pool with default parameters
      // ---------
      await poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      );
      
      // ---------
      // Assert: Check that pool parameters are correctly set
      // ---------
      currentBlockTimestamp = await (await ethers.provider.getBlock()).timestamp
      poolId = await getterFacet.getLatestPoolId();
      poolParams = await getterFacet.getPoolParameters(poolId); 
      expect(poolId).to.eq(1)
      expect(poolParams.referenceAsset).to.eq(referenceAsset);
      expect(poolParams.expiryTime).to.eq(expiryTime);
      expect(poolParams.floor).to.eq(floor);
      expect(poolParams.inflection).to.eq(inflection);
      expect(poolParams.cap).to.eq(cap);
      expect(poolParams.supplyInitial).to.eq(supplyPositionToken);
      expect(poolParams.collateralToken).to.eq(collateralToken);
      expect(poolParams.collateralBalanceShortInitial).to.eq(collateralBalanceShort);
      expect(poolParams.collateralBalanceLongInitial).to.eq(collateralBalanceLong);
      expect(poolParams.collateralBalance).to.eq(collateralBalanceShort.add(collateralBalanceLong));
      expect(poolParams.shortToken).is.properAddress;
      expect(poolParams.longToken).is.properAddress;
      expect(poolParams.finalReferenceValue).to.eq(0);
      expect(poolParams.statusFinalReferenceValue).to.eq(0);
      expect(poolParams.redemptionAmountLongToken).to.eq(0);
      expect(poolParams.redemptionAmountShortToken).to.eq(0);
      expect(poolParams.statusTimestamp).to.eq(currentBlockTimestamp);
      expect(poolParams.dataProvider).to.eq(oracle.address);
      expect(poolParams.redemptionFee).to.eq(redemptionFee);
      expect(poolParams.settlementFee).to.eq(settlementFee);
      expect(poolParams.capacity).to.eq(capacity);

    })

    it('Returns the same pool parameters when retrieved via `getPoolParametersByAddress`', async () => {      
      // ---------
      // Act: Create contingent pool with default parameters
      // ---------
      await poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      );
      
      // ---------
      // Assert: Check that it returns the same pool parameters when called via `getPoolParametersByAddress`
      // ---------
      currentBlockTimestamp = await (await ethers.provider.getBlock()).timestamp
      poolId = await getterFacet.getLatestPoolId();
      poolParams = await getterFacet.getPoolParameters(poolId); 
      poolParamsByAddress = await getterFacet.getPoolParametersByAddress(poolParams.shortToken);
      expect(poolParamsByAddress.referenceAsset).to.eq(poolParams.referenceAsset);
      expect(poolParamsByAddress.expiryTime).to.eq(poolParams.expiryTime);
      expect(poolParamsByAddress.floor).to.eq(poolParams.floor);
      expect(poolParamsByAddress.inflection).to.eq(poolParams.inflection);
      expect(poolParamsByAddress.cap).to.eq(poolParams.cap);
      expect(poolParamsByAddress.supplyInitial).to.eq(poolParams.supplyInitial);
      expect(poolParamsByAddress.collateralToken).to.eq(poolParams.collateralToken);
      expect(poolParamsByAddress.collateralBalanceShortInitial).to.eq(poolParams.collateralBalanceShortInitial);
      expect(poolParamsByAddress.collateralBalanceLongInitial).to.eq(poolParams.collateralBalanceLongInitial);
      expect(poolParamsByAddress.collateralBalance).to.eq(poolParams.collateralBalance);
      expect(poolParamsByAddress.shortToken).to.eq(poolParams.shortToken);
      expect(poolParamsByAddress.longToken).to.eq(poolParams.longToken);
      expect(poolParamsByAddress.finalReferenceValue).to.eq(poolParams.finalReferenceValue);
      expect(poolParamsByAddress.statusFinalReferenceValue).to.eq(poolParams.statusFinalReferenceValue);
      expect(poolParamsByAddress.redemptionAmountLongToken).to.eq(poolParams.redemptionAmountLongToken);
      expect(poolParamsByAddress.redemptionAmountShortToken).to.eq(poolParams.redemptionAmountShortToken);
      expect(poolParamsByAddress.statusTimestamp).to.eq(poolParams.statusTimestamp);
      expect(poolParamsByAddress.dataProvider).to.eq(poolParams.dataProvider);
      expect(poolParamsByAddress.redemptionFee).to.eq(poolParams.redemptionFee);
      expect(poolParamsByAddress.settlementFee).to.eq(poolParams.settlementFee);
      expect(poolParamsByAddress.capacity).to.eq(poolParams.capacity);

    })

    it('Increases the short and long token supply', async () => {
      // ---------
      // Assert
      // ---------
      expect(await shortTokenInstance.totalSupply()).to.eq(supplyPositionToken)
      expect(await longTokenInstance.totalSupply()).to.eq(supplyPositionToken)
    })

    it('Assigns the diamond contract as the owner of the position tokens', async () => {
      expect(await shortTokenInstance.owner()).is.eq(diamondAddress);
      expect(await longTokenInstance.owner()).is.eq(diamondAddress);
    })

    it('Assigns the right poolId for each position token', async () => {
      expect(await shortTokenInstance.poolId()).is.eq(poolId);
      expect(await longTokenInstance.poolId()).is.eq(poolId);
    })

    it('Sets the position token names to L1 and S1', async () => {
      expect(await shortTokenInstance.name()).to.eq("S" + poolId);      
      expect(await longTokenInstance.name()).to.eq("L" + poolId);      
    })

    it('Sends position tokens to pool creator', async () => {
      expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(supplyPositionToken); 
      expect(await longTokenInstance.balanceOf(user1.address)).to.eq(supplyPositionToken); 
    })

    it('Reduces the user`s collateral token balance', async () => { 
      expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(userStartCollateralTokenBalance.sub(collateralBalanceShort.add(collateralBalanceLong)))
    })

    it('Increases the diamond`s collateral token balance', async () => { 
      expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralBalanceShort.add(collateralBalanceLong))
    })

    it('Increments the poolId', async () => {     
      // ---------
      // Act: Create a second contingent pool
      // ---------
      await poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      );
      
      // ---------
      // Assert: Check that the `poolId` increased
      // ---------
      expect(await getterFacet.getLatestPoolId()).to.eq(poolId.add(1));
      
    })

    // -------------------------------------------
    // Events 
    // -------------------------------------------

    it('Emits a PoolIssued event', async () => {
      const event = await poolIssuedEvent(poolFacet)
      expect(event.poolId).to.eq(poolId)
      expect(event.from).to.eq(user1.address)
      expect(event.collateralAmount).to.eq(collateralBalanceLong.add(collateralBalanceShort))
    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if an empty reference asset string is provided', async () => {
      // ---------
      // Arrange: Set invalid name for reference asset
      // ---------
      const invalidReferenceAsset = ''
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          invalidReferenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: no reference asset")
    })

    it('Reverts if floor is greater than inflection', async () => {
      // ---------
      // Arrange: Set invalid floor
      // ---------
      const invalidFloor = inflection.add(1)
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          invalidFloor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: floor greater inflection")
    })

    it('Reverts if cap is smaller than inflection', async () => {
      // ---------
      // Arrange: Set invalid floor
      // ---------
      const invalidCap = inflection.sub(1)
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          invalidCap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: cap smaller inflection")
    })

    it('Reverts if collateral token is zero address', async () => {
      // ---------
      // Arrange: Set invalid floor
      // ---------
      const invalidCollateralToken = ethers.constants.AddressZero
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          invalidCollateralToken, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: collateral token is zero address")
    })

    it('Reverts if data provider is zero address', async () => {
      // ---------
      // Arrange: Set invalid data provider
      // ---------
      const invalidDataProvider = ethers.constants.AddressZero
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          invalidDataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: data provider is zero address")
    })

    it('Reverts if position token supply is zero', async () => {
      // ---------
      // Arrange: Set invalid long token supply amount
      // ---------
      const invalidSupplyPositionToken = 0
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          invalidSupplyPositionToken, 
          collateralToken, 
          dataProvider,
          capacity
        ]
      )).to.be.revertedWith("DIVA: zero position token supply")
    })

    it('Reverts if total collateral exceeds pool capacity', async () => {
      // ---------
      // Arrange: Set invalid capacity
      // ---------
      const invalidCapacity = collateralBalanceShort.add(collateralBalanceLong).sub(1)
      
      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          collateralBalanceShort, 
          collateralBalanceLong,  
          supplyPositionToken, 
          collateralToken, 
          dataProvider,
          invalidCapacity 
        ]
      )).to.be.revertedWith("DIVA: pool capacity exceeded")
    })

    it('Reverts if collateral token has more than 18 decimals', async () => {
      // ---------
      // Arrange: Create an ERC20 token with 20 decimal places which should not be accepted
      // ---------
      _decimals = 20;
      collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", userStartCollateralTokenBalance, user1.address, _decimals);   

      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          parseUnits("100", _decimals),  // collateralBalanceShort
          parseUnits("200", _decimals),  // collateralBalanceLong 
          supplyPositionToken, 
          collateralTokenInstance.address, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: collateral token decimals above 18 or below 3")
    })
  

    it('Reverts if collateral token has less than 3 decimals', async () => {
      // ---------
      // Arrange: Create an ERC20 token with 3 decimal places which should not be accepted
      // ---------
      _decimals = 2;
      collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", userStartCollateralTokenBalance, user1.address, _decimals);   

      // ---------
      // Act & Assert: Check that contingent pool creation fails
      // ---------
      await expect(poolFacet.connect(user1).createContingentPool(
        [
          referenceAsset, 
          expiryTime, 
          floor,
          inflection, 
          cap,
          parseUnits("100", _decimals),  // collateralBalanceShort
          parseUnits("200", _decimals),  // collateralBalanceLong
          supplyPositionToken, 
          collateralTokenInstance.address, 
          dataProvider,
          capacity 
        ]
      )).to.be.revertedWith("DIVA: collateral token decimals above 18 or below 3")
    })

    it('Reverts if the creation of new pools was paused', async () => {
      // ---------
      // Arrange: Pause the functionality to create new pools
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(true)
      govParams = await getterFacet.getGovernanceParameters()
      expect(govParams.pauseReceiveCollateral).to.be.true;
      
      // ---------
      // Act & Assert: Confirm that the creation of new pools s not possible if contract is paused
      // ---------
      await expect(
        poolFacet.connect(user1).createContingentPool(
          [
            referenceAsset, 
            expiryTime, 
            floor,
            inflection, 
            cap,
            collateralBalanceShort, 
            collateralBalanceLong,  
            supplyPositionToken, 
            collateralToken, 
            dataProvider,
            capacity 
          ]
        )
      ).to.be.revertedWith("DIVA: receive collateral paused");
  })
  })
})
