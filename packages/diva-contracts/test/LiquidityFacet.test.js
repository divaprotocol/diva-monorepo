 
  const { liquidityAddedEvent, liquidityRemovedEvent } = require('./events')
  const { expect } = require('chai')
  const { ethers } = require('hardhat')
  const { BigNumber } = require('ethers')
  const { deployDiamond } = require('../scripts/deploy.js')
  const { erc20DeployFixture } = require("./fixtures/MockERC20Fixture")
  const { positionTokenAttachFixture } = require("./fixtures/PositionTokenFixture")
  const { parseEther, parseUnits, formatEthers, formatUnits } = require('@ethersproject/units')
  const { getExpiryInSeconds, getLastTimestamp, setNextTimestamp } = require('./utils.js')
  const { calcFee } = require('./libDIVA.js')
  
  describe('LiquidityFacet', async function () {
    
    let diamondAddress
    let poolFacet, liquidityFacet, getterFacet, claimFacet, settlementFacet
    let contractOwner, treasury, oracle, user1, user2
    let collateralTokenInstance
    // -------
    // Input: Collateral token decimals (>= 3 && <= 18)
    // -------
    const decimals = 18

    before(async function () {
      [contractOwner, treasury, oracle, user1, user2, ...accounts] = await ethers.getSigners(); // keep contractOwner and treasury at first two positions in line with deploy script
      
      // ---------
      // Setup: Deploy diamond contract (incl. facets) and connect to the diamond contract via facet specific ABI's
      // ---------
      diamondAddress = await deployDiamond();
      poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
      liquidityFacet = await ethers.getContractAt('LiquidityFacet', diamondAddress)
      getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
      claimFacet = await ethers.getContractAt('ClaimFacet', diamondAddress)
      settlementFacet = await ethers.getContractAt('SettlementFacet', diamondAddress)
      governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)

    });
  
    describe('add and remove liquidity', async () => {
        let user1StartCollateralTokenBalance;
        let user2StartCollateralTokenBalance;
        let additionalCollateralAmount;  
        let positionTokensToRedeem;

        beforeEach(async () => {  
            // ---------
            // Arrange: Equip user1 and user2 with collateral tokens, approve collateral token for diamond contract, and specify default parameters for test
            // ---------
            user1StartCollateralTokenBalance = 100000;
            user2StartCollateralTokenBalance = 50000;
            additionalCollateralAmount = 5000; 
            positionTokensToRedeem = "66.698111597630027894";

            // Mint ERC20 collateral token with `decimals` decimals and send it to user 1
            collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", parseUnits(user1StartCollateralTokenBalance.toString(), decimals), user1.address, decimals);     
            
            // Transfer half of user1's DCT balance to user2 who will add liquidity
            await collateralTokenInstance.connect(user1).transfer(user2.address, parseUnits(user2StartCollateralTokenBalance.toString(), decimals));
    
            // Set user1 allowances for Diamond contract
            await collateralTokenInstance.connect(user1).approve(diamondAddress, parseUnits(user1StartCollateralTokenBalance.toString(), decimals));
    
            // Set user2 allowances for Diamond contract
            await collateralTokenInstance.connect(user2).approve(diamondAddress, parseUnits(user2StartCollateralTokenBalance.toString(), decimals));
    
        });

        // Function to create contingent pools pre-populated with default values that can be overwritten depending on the test case 
        async function createContingentPool({ 
                referenceAsset = "BTC/USD",
                expiryTime = getExpiryInSeconds(7200), 
                floor = 1198.53,
                inflection = 1605.33, 
                cap = 2001.17,
                collateralBalanceShort = 10000.54,
                collateralBalanceLong = 5000.818,
                supplyPositionToken = 100.556,
                collateralToken = collateralTokenInstance.address,                
                dataProvider = oracle.address,               
                capacity = 0,
                poolCreater = user1             
        } = {}) {
                await poolFacet.connect(poolCreater).createContingentPool(
                [
                    referenceAsset, 
                    expiryTime, 
                    parseEther(floor.toString()),
                    parseEther(inflection.toString()), 
                    parseEther(cap.toString()),
                    parseUnits(collateralBalanceShort.toString(), decimals), 
                    parseUnits(collateralBalanceLong.toString(), decimals),  
                    parseEther(supplyPositionToken.toString()), 
                    collateralToken, 
                    dataProvider,
                    capacity 
                ]
                );
        }
  
        describe('addLiquidity', async () => { 

            beforeEach(async function () {      
                if (
                    this.currentTest?.title !==
                    'Adds liquidity from an existing pool and updates the pool parameters' && 
                    this.currentTest?.title !=='Allows to add liquidity if pool has a max capacity defined but added amount does not exceed it'
                ) {
                    // ---------
                    // Arrange: Create contingent pool
                    // ---------
                    await createContingentPool()
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                    shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                    longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)
                    
                }
            })
            
            
            // -------------------------------------------
            // Functionality
            // -------------------------------------------
        
            it('Adds liquidity from an existing pool, updates the pool parameters and increases position token supply', async () => { 
                // ---------
                // Arrange: Create contingent pool
                // ---------
                await createContingentPool()
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)
                
                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits(additionalCollateralAmount.toString(), decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)
        
                // ---------
                // Assert: Check that the relevant pool parameters are updated correctly and the others remain unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                incrSupplyPositionToken = additionalCollateralAmount.mul(poolParamsBefore.supplyInitial).div(poolParamsBefore.collateralBalance)
                newCollateralBalance = (poolParamsBefore.collateralBalance).add(additionalCollateralAmount)
                // Parameters expected to be updated
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(poolParamsAfter.collateralBalance).to.eq(newCollateralBalance)
                // Parameters expected to remain unchanged
                expect(poolParamsAfter.referenceAsset).to.eq(poolParamsBefore.referenceAsset);
                expect(poolParamsAfter.expiryTime).to.eq(poolParamsBefore.expiryTime);
                expect(poolParamsAfter.floor).to.eq(poolParamsBefore.floor);
                expect(poolParamsAfter.inflection).to.eq(poolParamsBefore.inflection);
                expect(poolParamsAfter.cap).to.eq(poolParamsBefore.cap);
                expect(poolParamsAfter.supplyInitial).to.eq(poolParamsBefore.supplyInitial);
                expect(poolParamsAfter.collateralToken).to.eq(poolParamsBefore.collateralToken);
                expect(poolParamsAfter.collateralBalanceShortInitial).to.eq(poolParamsBefore.collateralBalanceShortInitial);
                expect(poolParamsAfter.collateralBalanceLongInitial).to.eq(poolParamsBefore.collateralBalanceLongInitial);
                expect(poolParamsAfter.shortToken).to.eq(poolParamsBefore.shortToken);
                expect(poolParamsAfter.longToken).to.eq(poolParamsBefore.longToken);
                expect(poolParamsAfter.finalReferenceValue).to.eq(0);
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(0);
                expect(poolParamsAfter.redemptionAmountLongToken).to.eq(0);
                expect(poolParamsAfter.redemptionAmountShortToken).to.eq(0);
                expect(poolParamsAfter.statusTimestamp).to.eq(poolParamsBefore.statusTimestamp);
                expect(poolParamsAfter.dataProvider).to.eq(poolParamsBefore.dataProvider);
                expect(poolParamsAfter.redemptionFee).to.eq(poolParamsBefore.redemptionFee);
                expect(poolParamsAfter.settlementFee).to.eq(poolParamsBefore.settlementFee);
                expect(poolParamsAfter.capacity).to.eq(poolParamsBefore.capacity);
     
            })

            it('Sends short and long tokens to user2', async () => { 
                // ---------
                // Arrange: Confirm that user2's short and long token balances are zero
                // ---------
                expect(await shortTokenInstance.balanceOf(user2.address)).to.eq(0)
                expect(await longTokenInstance.balanceOf(user2.address)).to.eq(0)

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits(additionalCollateralAmount.toString(), decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)

                // ---------
                // Assert: Check that user2's short and long token balances increased
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                incrSupplyPositionToken = additionalCollateralAmount.mul(poolParamsBefore.supplyInitial).div(poolParamsBefore.collateralBalance)
                expect(await shortTokenInstance.balanceOf(user2.address)).to.eq(incrSupplyPositionToken)
                expect(await longTokenInstance.balanceOf(user2.address)).to.eq(incrSupplyPositionToken)

            })

            it('Reduces user2`s collateral token balance', async () => { 
                // ---------
                // Arrange: Confirm that user2's collateral token balance equals `user2StartCollateralTokenBalance`
                // ---------
                expect(await collateralTokenInstance.balanceOf(user2.address)).to.eq(parseUnits(user2StartCollateralTokenBalance.toString(), decimals))
                
                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits(additionalCollateralAmount.toString(), decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)

                // ---------
                // Assert: Check that user2's collateral token balanced reduced
                // ---------
                user2CollateralTokenBalanceAfter = await collateralTokenInstance.balanceOf(user2.address)
                expect(user2CollateralTokenBalanceAfter).to.eq(parseUnits(user2StartCollateralTokenBalance.toString(), decimals).sub(additionalCollateralAmount))

            })

            it('Increases diamond contract`s collateral token balance', async () => { 
                // ---------
                // Arrange: Get diamond contract's current collateral token balance
                // ---------
                diamondCollateralTokenBalanceBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                expect(diamondCollateralTokenBalanceBefore).to.eq(poolParamsBefore.collateralBalance);

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits(additionalCollateralAmount.toString(), decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)

                // ---------
                // Assert: Check that diamond contract's collateral token balance increased
                // ---------
                diamondCollateralTokenBalanceAfter = await collateralTokenInstance.balanceOf(diamondAddress)
                expect(diamondCollateralTokenBalanceAfter).to.eq(diamondCollateralTokenBalanceBefore.add(additionalCollateralAmount))

            })

            it('Allows to add liquidity if pool has a max capacity defined but added amount does not exceed it', async () => { 
                // ---------
                // Arrange: Create pool with capacity > 0 (chosen to be 100 collateral units higher than the initial collateral amount (10000.54 + 5000.818))
                // ---------
                maxPoolCapacity = (parseUnits("10000.54", decimals)).add(parseUnits("5000.818", decimals)).add(parseUnits("100", decimals)) 
                await createContingentPool({
                    capacity: maxPoolCapacity 
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits("100", decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)
        
                // ---------
                // Assert: Check that the relevant pool parameters are updated correctly and the others remain unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                incrSupplyPositionToken = additionalCollateralAmount.mul(poolParamsBefore.supplyInitial).div(poolParamsBefore.collateralBalance)
                newCollateralBalance = (poolParamsBefore.collateralBalance).add(additionalCollateralAmount)
                // Parameters expected to be updated
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(poolParamsAfter.collateralBalance).to.eq(newCollateralBalance)
                // Parameters expected to remain unchanged
                expect(poolParamsAfter.referenceAsset).to.eq(poolParamsBefore.referenceAsset);
                expect(poolParamsAfter.expiryTime).to.eq(poolParamsBefore.expiryTime);
                expect(poolParamsAfter.floor).to.eq(poolParamsBefore.floor);
                expect(poolParamsAfter.inflection).to.eq(poolParamsBefore.inflection);
                expect(poolParamsAfter.cap).to.eq(poolParamsBefore.cap);
                expect(poolParamsAfter.supplyInitial).to.eq(poolParamsBefore.supplyInitial);
                expect(poolParamsAfter.collateralToken).to.eq(poolParamsBefore.collateralToken);
                expect(poolParamsAfter.collateralBalanceShortInitial).to.eq(poolParamsBefore.collateralBalanceShortInitial);
                expect(poolParamsAfter.collateralBalanceLongInitial).to.eq(poolParamsBefore.collateralBalanceLongInitial);
                expect(poolParamsAfter.shortToken).to.eq(poolParamsBefore.shortToken);
                expect(poolParamsAfter.longToken).to.eq(poolParamsBefore.longToken);
                expect(poolParamsAfter.finalReferenceValue).to.eq(0);
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(0);
                expect(poolParamsAfter.redemptionAmountLongToken).to.eq(0);
                expect(poolParamsAfter.redemptionAmountShortToken).to.eq(0);
                expect(poolParamsAfter.statusTimestamp).to.eq(poolParamsBefore.statusTimestamp);
                expect(poolParamsAfter.dataProvider).to.eq(poolParamsBefore.dataProvider);
                expect(poolParamsAfter.redemptionFee).to.eq(poolParamsBefore.redemptionFee);
                expect(poolParamsAfter.settlementFee).to.eq(poolParamsBefore.settlementFee);
                expect(poolParamsAfter.capacity).to.eq(poolParamsBefore.capacity);
            })

            it('Allows to add zero liquidity to the pool without affecting the pool parameters and position token supply', async () => {
                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = 0
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount);

                // ---------
                // Assert: Check that the relevant pool parameters are unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(poolParamsAfter.collateralBalance).to.eq(poolParamsBefore.collateralBalance) 
            })

            it('Adds the smallest unit of the collateral token as liquidity to an existing pool and updates the pool parameters', async () => {
                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = BigNumber.from(1)
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount);

                // ---------
                // Assert: Check that the relevant pool parameters are unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                incrSupplyPositionToken = additionalCollateralAmount.mul(poolParamsBefore.supplyInitial).div(poolParamsBefore.collateralBalance)
                newCollateralBalance = (poolParamsBefore.collateralBalance).add(additionalCollateralAmount)

                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.add(incrSupplyPositionToken))
                expect(poolParamsAfter.collateralBalance).to.eq(newCollateralBalance)
            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after adding liquidity (test where supplyPositionToken = collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken = collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        parseUnits("50", decimals),         // collateralBalanceShort
                        parseUnits("50.1", decimals),       // collateralBalanceLong
                        parseEther("100.1"),                // supplyPositionToken  
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenSupplyBefore = await shortTokenInstance.totalSupply()
                longTokenSupplyBefore = await longTokenInstance.totalSupply()

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = BigNumber.from(1);
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount);

                // ---------
                // Assert: Check that the ratio between the new position tokens issued and increase in pool collateral does not exceed the original ratios. If it holds true for the 
                // smallest unit of position token added, then it will also hold true for larger amounts     
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                shortTokenSupplyAfter = await shortTokenInstance.totalSupply()
                longTokenSupplyAfter = await longTokenInstance.totalSupply()
                expect(((shortTokenSupplyAfter).sub(shortTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect(((longTokenSupplyAfter).sub(longTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((shortTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((longTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))

            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after adding liquidity (test where supplyPositionToken >> collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken >> collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        5,                                  // collateralBalanceShort
                        7,                                  // collateralBalanceLong
                        parseEther("1000000000000000.1"),   // supplyPositionToken  
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenSupplyBefore = await shortTokenInstance.totalSupply()
                longTokenSupplyBefore = await longTokenInstance.totalSupply()

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = BigNumber.from(1);
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount);

                // ---------
                // Assert: Check that the ratio between the new position tokens issued and increase in pool collateral does not exceed the original ratios. If it holds for the 
                // smallest unit of position token added, then it will also hold for larger amounts     
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                shortTokenSupplyAfter = await shortTokenInstance.totalSupply()
                longTokenSupplyAfter = await longTokenInstance.totalSupply()
                expect(((shortTokenSupplyAfter).sub(shortTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect(((longTokenSupplyAfter).sub(longTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((shortTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((longTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))

            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after adding liquidity (test where supplyPositionToken << collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken << collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        parseUnits("500", decimals),        // collateralBalanceShort
                        parseUnits("5000.1", decimals),     // collateralBalanceLong
                        1,                                  // supplyPositionToken  
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenSupplyBefore = await shortTokenInstance.totalSupply()
                longTokenSupplyBefore = await longTokenInstance.totalSupply()

                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = BigNumber.from(1);
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount);

                // ---------
                // Assert: Check that the ratio between the new position tokens issued and increase in pool collateral does not exceed the original ratios. If it holds for the 
                // smallest unit of position token added, then it will also hold for larger amounts     
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                shortTokenSupplyAfter = await shortTokenInstance.totalSupply()
                longTokenSupplyAfter = await longTokenInstance.totalSupply()
                expect(((shortTokenSupplyAfter).sub(shortTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect(((longTokenSupplyAfter).sub(longTokenSupplyBefore)).div((poolParamsAfter.collateralBalance).sub(poolParamsBefore.collateralBalance))).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((shortTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((longTokenSupplyAfter).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))

            })
        
            // -------------------------------------------
            // Events 
            // -------------------------------------------
        
            it('Emits a LiquidityAdded event', async () => {               
                // ---------
                // Act: Add liquidity
                // ---------
                additionalCollateralAmount = parseUnits("10", decimals)        
                await liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)
                
                // ---------
                // Assert: Check that it emits a LiquidityAdded event
                // ---------
                const event = await liquidityAddedEvent(liquidityFacet)
                expect(event.poolId).to.eq(poolId)
                expect(event.from).to.eq(user2.address)
                expect(event.collateralAmount).to.eq(additionalCollateralAmount)
            })
        
            // -------------------------------------------
            // Reverts
            // -------------------------------------------

            it('Reverts if pool is already expired (block timestamp > expiryTime)', async () => {
                // ---------
                // Arrange: Create an expired contingent pool
                // ---------
                await createContingentPool({
                    expiryTime: await getLastTimestamp()
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(await getLastTimestamp()).to.be.gt(poolParams.expiryTime) // block timestamp > expiryTime

                // ---------
                // Act & Assert: Check that adding liquidity fails when pool expired
                // ---------
                additionalCollateralAmount = parseUnits("10", decimals)  
                await expect(liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)).to.be.revertedWith("DIVA: pool expired")
            })

            it('Reverts if pool is already expired (block timestamp = expiryTime)', async () => {
                // ---------
                // Arrange: Create a contingent pool that expires shortly
                // ---------
                await createContingentPool({
                    expiryTime: (await getLastTimestamp()) + 100
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId)
                await setNextTimestamp(ethers.provider, (poolParams.expiryTime).toNumber()) // set next block timestamp equal to expiryTime

                // ---------
                // Act & Assert: Check that adding liquidity fails when executed right at pool expiry
                // ---------
                additionalCollateralAmount = parseUnits("10", decimals)  
                await expect(liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)).to.be.revertedWith("DIVA: pool expired")
            })

            it('Reverts if pool capacity is exceeded', async () => {
                // ---------
                // Arrange: Create pool with capacity > 0 (chosen to be equal to collateral amount in the pool)
                // ---------
                maxPoolCapacity = (parseUnits("10000.54", decimals)).add(parseUnits("5000.818", decimals))
                await createContingentPool({
                    capacity: maxPoolCapacity 
                })
                poolId = await getterFacet.getLatestPoolId()

                // ---------
                // Act & Assert: Check that adding liquidity fails if the pool capacity is exceeded
                // ---------
                additionalCollateralAmount = 1
                await expect(liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)).to.be.revertedWith("DIVA: exceeds max pool capacity")

            })

            it('Reverts if a very large collateral amount is added that causes the `multiplyDecimal` function in SafeDecimalMath to overflow', async () => {
                // ---------
                // Act & Assert
                // ---------
                // Add a large amount that will cause the formula in SafeDecimalMath's `multiplyDecimal` function to overflow
                additionalCollateralAmount = ((BigNumber.from(2)).pow(256)).sub(1)
                await expect(liquidityFacet.connect(user2).addLiquidity(poolId, additionalCollateralAmount)).to.be.reverted;
            })

            it('Reverts if the addition of liquidity was paused', async () => {
                // ---------
                // Arrange: Pause the functionality to add liquidity
                // ---------
                await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(true)
                govParams = await getterFacet.getGovernanceParameters()
                expect(govParams.pauseReceiveCollateral).to.be.true;
                
                // ---------
                // Act & Assert: Confirm that addition of liquidty is not possible if contract is paused
                // ---------
                await expect(liquidityFacet.connect(user2).addLiquidity(poolId, 1)).to.be.revertedWith("DIVA: receive collateral paused");

                // ---------
                // Reset: Unpause again so that the remaining tests go through
                // ---------
                await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(false)

            })
        })

        describe('removeLiquidity', async () => {            
            
            beforeEach(async function () {
                
                if (
                    this.currentTest?.title !==
                    'Removes liquidity from an existing pool and updates the pool parameters'
                ) {
                    // ---------
                    // Arrange: Create contingent pool, calculate short token amount to redeem, collateral to return and fees to be paid
                    // ---------
                    await createContingentPool()
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                    shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                    longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)

                    // Format `removeLiquidity` function input to BigNumber with 18 decimals
                    positionTokensToRedeem = parseEther(positionTokensToRedeem)
                    // Calculate collateral to return gross of fees (calculated inside `removeLiquidity` function)
                    collateralToReturnGross = positionTokensToRedeem.mul(poolParamsBefore.collateralBalance).div(poolParamsBefore.supplyInitial) 
                    // Calculate fees
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, collateralToReturnGross, decimals)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, collateralToReturnGross, decimals) 
                    fees = redemptionFee.add(settlementFee)
                    // Calculate collateral to return net of fees
                    collateralToReturnNet = collateralToReturnGross.sub(fees) 
                    
                }
            })
      
            // -------------------------------------------
            // Functionality
            // -------------------------------------------
            it('Removes liquidity from an existing pool and updates the pool parameters', async () => {
                // ---------
                // Arrange: Create contingent pool, calculate short token amount to redeem, collateral to return and fees to be paid
                // ---------
                await createContingentPool()
                // Status before removing liquidity (after the contingent pool has been created)
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)
                // Fee claims are zero
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                // Format `removeLiquidity` function input to BigNumber with the right number of decimals
                positionTokensToRedeem = parseEther(positionTokensToRedeem)
                // Calculate collateral to return gross of fees (calculated inside `removeLiquidity` function)
                collateralToReturnGross = positionTokensToRedeem.mul(poolParamsBefore.collateralBalance).div(poolParamsBefore.supplyInitial) 
                // Calculate fees
                redemptionFee = calcFee(poolParamsBefore.redemptionFee, collateralToReturnGross, decimals)
                settlementFee = calcFee(poolParamsBefore.settlementFee, collateralToReturnGross, decimals) 
                fees = redemptionFee.add(settlementFee)
                // Calculate collateral to return net of fees
                collateralToReturnNet = collateralToReturnGross.sub(fees) 
                // Print key figures to console
                console.log("redemptionFee: " + redemptionFee)
                console.log("settlementFee: " + settlementFee)
                console.log("long tokens to remove (function input): " + positionTokensToRedeem)  
                console.log("collateral to remove (calculated inside `removeLiquidity`): " + collateralToReturnGross)
                
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
        
                // ---------
                // Assert: Check that relevant pool parameters were updated and others remained unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                // Parameters expected to be updated
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.sub(positionTokensToRedeem))
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial.sub(positionTokensToRedeem))
                expect(poolParamsAfter.collateralBalance).to.eq((poolParamsBefore.collateralBalance).sub(collateralToReturnGross)) 
                // Parameters expected to remain unchanged
                expect(poolParamsAfter.referenceAsset).to.eq(poolParamsBefore.referenceAsset);
                expect(poolParamsAfter.expiryTime).to.eq(poolParamsBefore.expiryTime);
                expect(poolParamsAfter.floor).to.eq(poolParamsBefore.floor);
                expect(poolParamsAfter.inflection).to.eq(poolParamsBefore.inflection);
                expect(poolParamsAfter.cap).to.eq(poolParamsBefore.cap);
                expect(poolParamsAfter.supplyInitial).to.eq(poolParamsBefore.supplyInitial);
                expect(poolParamsAfter.collateralToken).to.eq(poolParamsBefore.collateralToken);
                expect(poolParamsAfter.collateralBalanceShortInitial).to.eq(poolParamsBefore.collateralBalanceShortInitial);
                expect(poolParamsAfter.collateralBalanceLongInitial).to.eq(poolParamsBefore.collateralBalanceLongInitial);
                expect(poolParamsAfter.shortToken).to.eq(poolParamsBefore.shortToken);
                expect(poolParamsAfter.longToken).to.eq(poolParamsBefore.longToken);
                expect(poolParamsAfter.finalReferenceValue).to.eq(0);
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(0);
                expect(poolParamsAfter.redemptionAmountLongToken).to.eq(0);
                expect(poolParamsAfter.redemptionAmountShortToken).to.eq(0);
                expect(poolParamsAfter.statusTimestamp).to.eq(poolParamsBefore.statusTimestamp);
                expect(poolParamsAfter.dataProvider).to.eq(poolParamsBefore.dataProvider);
                expect(poolParamsAfter.redemptionFee).to.eq(poolParamsBefore.redemptionFee);
                expect(poolParamsAfter.settlementFee).to.eq(poolParamsBefore.settlementFee);
                expect(poolParamsAfter.capacity).to.eq(poolParamsBefore.capacity);

            })

            it('Decreases the short and long token supply', async () => {
                // ---------
                // Arrange: Confirm that the total short and long token supply equals those stored in the pool parameters
                // ---------
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check total supply of short and long tokens
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(await shortTokenInstance.totalSupply()).to.eq((poolParamsBefore.supplyInitial).sub(positionTokensToRedeem)) 
                expect(await longTokenInstance.totalSupply()).to.eq((poolParamsBefore.supplyInitial).sub(positionTokensToRedeem)) 
            })

            it('Decreases user1`s short and long token balance', async () => {
                // ---------
                // Arrange: Confirm that user1's short and long token balances equals those stored in the pool parameters
                // ---------
                expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.balanceOf(user1.address)).to.eq(poolParamsBefore.supplyInitial)
                
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check the user1's short and long token balance got reduced
                // ---------
                expect(await shortTokenInstance.balanceOf(user1.address)).to.eq((poolParamsBefore.supplyInitial).sub(positionTokensToRedeem))
                expect(await longTokenInstance.balanceOf(user1.address)).to.eq((poolParamsBefore.supplyInitial).sub(positionTokensToRedeem))
            })

            it('Decreases the diamond contract`s collateral token balance down to the fee amount owed to the treasury and data provider', async () => {
                // ---------
                // Arrange: Confirm that diamond contract's balance equals that stored in the pool parameters
                // ---------
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(poolParamsBefore.collateralBalance);

                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check that diamond contract's collateral token balance reduced
                // ---------
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq((poolParamsBefore.collateralBalance).sub(collateralToReturnNet))
            })

            it('Decreases the diamond contract`s collateral token balance down to zero after treasury and data provider have claimed their fees', async () => {
                // ---------
                // Arrange: Confirm that diamond contract's balance equals that stored in the pool parameters
                // ---------
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(poolParamsBefore.collateralBalance);

                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.be.gt(0)
                await claimFacet.connect(treasury).claimFees(poolParamsBefore.collateralToken)
                await claimFacet.connect(oracle).claimFees(poolParamsBefore.collateralToken)
                
                // ---------
                // Assert: Check that the diamond contract's collateral token balance reduced to zero
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq((poolParamsBefore.collateralBalance).sub(collateralToReturnGross))
            })

            it('Increases user1`s collateral token balance', async () => {
                // ---------
                // Arrange: Get user1's current collateral token balance before liquidity is removed
                // ---------
                userCollateralTokenBalanceBefore = await collateralTokenInstance.balanceOf(user1.address)

                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check that user1's collateral token balance increased
                // ---------
                expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(userCollateralTokenBalanceBefore.add(collateralToReturnNet)) 
            })

            it('Allocates the redemption fee to the treasury', async () => {
                // ---------
                // Arrange: Confirm that treasury's fee claim is zero at the beginning
                // ---------
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);

                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check that the right fee claim amount was allocated to the treasury
                // ---------
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee); 
            })

            it('Allocates the settlement fee to the data provider', async () => {
                // ---------
                // Arrange: Confirm that data provider's fee claim is zero at the beginning
                // ---------
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);

                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check that the right fee claim amount was allocated to the data provider
                // ---------
                expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);
            })

            it('Sets relevant pool parameters to zero if all long tokens are redeemed', async () => {
                // ---------
                // Arrange: Set long token amount to redeem equal to the overall long token supply
                // ---------
                positionTokensToRedeem = poolParamsBefore.supplyInitial
                
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check that relevant parameters are set to zero and others remain unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                // Parameters expected to be updated
                expect(await shortTokenInstance.totalSupply()).to.eq(0)
                expect(await longTokenInstance.totalSupply()).to.eq(0)
                expect(poolParamsAfter.collateralBalance).to.eq(0) 
                // Parameters expected to remain unchanged
                expect(poolParamsAfter.referenceAsset).to.eq(poolParamsBefore.referenceAsset);
                expect(poolParamsAfter.expiryTime).to.eq(poolParamsBefore.expiryTime);
                expect(poolParamsAfter.floor).to.eq(poolParamsBefore.floor);
                expect(poolParamsAfter.inflection).to.eq(poolParamsBefore.inflection);
                expect(poolParamsAfter.cap).to.eq(poolParamsBefore.cap);
                expect(poolParamsAfter.supplyInitial).to.eq(poolParamsBefore.supplyInitial);
                expect(poolParamsAfter.collateralToken).to.eq(poolParamsBefore.collateralToken);
                expect(poolParamsAfter.collateralBalanceShortInitial).to.eq(poolParamsBefore.collateralBalanceShortInitial);
                expect(poolParamsAfter.collateralBalanceLongInitial).to.eq(poolParamsBefore.collateralBalanceLongInitial);
                expect(poolParamsAfter.shortToken).to.eq(poolParamsBefore.shortToken);
                expect(poolParamsAfter.longToken).to.eq(poolParamsBefore.longToken);
                expect(poolParamsAfter.finalReferenceValue).to.eq(0);
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(0);
                expect(poolParamsAfter.redemptionAmountLongToken).to.eq(0);
                expect(poolParamsAfter.redemptionAmountShortToken).to.eq(0);
                expect(poolParamsAfter.statusTimestamp).to.eq(poolParamsBefore.statusTimestamp);
                expect(poolParamsAfter.dataProvider).to.eq(poolParamsBefore.dataProvider);
                expect(poolParamsAfter.redemptionFee).to.eq(poolParamsBefore.redemptionFee);
                expect(poolParamsAfter.settlementFee).to.eq(poolParamsBefore.settlementFee);
                expect(poolParamsAfter.capacity).to.eq(poolParamsBefore.capacity);
            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after removal of liquidity (test where supplyPositionToken = collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken = collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        parseUnits("50", decimals),         // collateralBalanceShort
                        parseUnits("50.1", decimals),       // collateralBalanceLong
                        parseEther("100.1"),                // supplyPositionToken  
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 

                // ---------
                // Act: Remove liquidity
                // ---------
                positionTokensToRedeem = BigNumber.from(1)
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check that the new supplyPositionToken to collateralBalance ratio is smaller than or equal to the original one
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect((await shortTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((await longTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))

            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after removal of liquidity (test where supplyPositionToken >> collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken >> collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        5,                                  // collateralBalanceShort
                        7,                                  // collateralBalanceLong
                        parseEther("100000000000000.1"),    // supplyPositionToken  
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 

                // ---------
                // Act: Remove liquidity
                // ---------
                positionTokensToRedeem = BigNumber.from(1)
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check that the new supplyPositionToken to collateralBalance ratio is smaller than or equal to the original one
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect((await shortTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((await longTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))

            })

            it('Does not increase the position token supply to collateral balance ratio compared to initial ratios after removal of liquidity (test where supplyPositionToken << collateralBalance)', async () => {
                // ---------
                // Arrange: Create a contingent pool with supplyPositionToken << collateralBalance
                // ---------
                await poolFacet.connect(user1).createContingentPool(
                    [
                        "BTC/USD",                          // reference asset
                        getExpiryInSeconds(7200),           // expiryTime
                        parseEther("1198.53"),              // floor
                        parseEther("1605.33"),              // inflection
                        parseEther("2001.17"),              // cap
                        parseUnits("5000", decimals),       // collateralBalanceShort
                        parseUnits("500.1", decimals),      // collateralBalanceLong
                        10000,                              // supplyPositionToken
                        collateralTokenInstance.address,    // collateral token address
                        oracle.address,                     // data provider
                        0                                   // capacity 
                    ]
                    );
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 

                // ---------
                // Act: Remove liquidity
                // ---------
                positionTokensToRedeem = BigNumber.from(1) // choose value < supplyPositionToken, otherwise you will remove all collateral (already covered in another test)
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)
                
                // ---------
                // Assert: Check that the new supplyPositionToken to collateralBalance ratio is smaller than or equal to the original one
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect((await shortTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
                expect((await longTokenInstance.totalSupply()).div(poolParamsAfter.collateralBalance)).to.be.lte((poolParamsBefore.supplyInitial).div((poolParamsBefore.collateralBalanceLongInitial).add(poolParamsBefore.collateralBalanceShortInitial)))
            })


            it('Leaves the pool parameters unchanged if zero position tokens are redeemed', async () => {
                // ---------
                // Arrange: Set positiont token amount to redeem equal to zero
                // ---------
                positionTokensToRedeem = 0
                
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check that all parameters remain unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(poolParamsAfter.collateralBalance).to.eq(poolParamsBefore.collateralBalance) 
                expect(poolParamsAfter.referenceAsset).to.eq(poolParamsBefore.referenceAsset);
                expect(poolParamsAfter.expiryTime).to.eq(poolParamsBefore.expiryTime);
                expect(poolParamsAfter.floor).to.eq(poolParamsBefore.floor);
                expect(poolParamsAfter.inflection).to.eq(poolParamsBefore.inflection);
                expect(poolParamsAfter.cap).to.eq(poolParamsBefore.cap);
                expect(poolParamsAfter.supplyInitial).to.eq(poolParamsBefore.supplyInitial);
                expect(poolParamsAfter.collateralToken).to.eq(poolParamsBefore.collateralToken);
                expect(poolParamsAfter.collateralBalanceShortInitial).to.eq(poolParamsBefore.collateralBalanceShortInitial);
                expect(poolParamsAfter.collateralBalanceLongInitial).to.eq(poolParamsBefore.collateralBalanceLongInitial);
                expect(poolParamsAfter.shortToken).to.eq(poolParamsBefore.shortToken);
                expect(poolParamsAfter.longToken).to.eq(poolParamsBefore.longToken);
                expect(poolParamsAfter.finalReferenceValue).to.eq(0);
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(0);
                expect(poolParamsAfter.redemptionAmountLongToken).to.eq(0);
                expect(poolParamsAfter.redemptionAmountShortToken).to.eq(0);
                expect(poolParamsAfter.statusTimestamp).to.eq(poolParamsBefore.statusTimestamp);
                expect(poolParamsAfter.dataProvider).to.eq(poolParamsBefore.dataProvider);
                expect(poolParamsAfter.redemptionFee).to.eq(poolParamsBefore.redemptionFee);
                expect(poolParamsAfter.settlementFee).to.eq(poolParamsBefore.settlementFee);
                expect(poolParamsAfter.capacity).to.eq(poolParamsBefore.capacity);
            })

            it('Allows to add liquidity after it has been removed entirely', async () => {
                // ---------
                // Arrange: Remove all liquidity from a pool and claim all fees to make sure that diamond contract has a zero collateral token balance 
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, poolParamsBefore.supplyInitial)
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(await shortTokenInstance.totalSupply()).to.eq(0)
                expect(await longTokenInstance.totalSupply()).to.eq(0)
                expect(poolParamsAfter.collateralBalance).to.eq(0)
                // Treasury and data provider claim their fees to simplify the test without losing generality 
                await claimFacet.connect(treasury).claimFees(poolParamsAfter.collateralToken)
                await claimFacet.connect(oracle).claimFees(poolParamsAfter.collateralToken)
                expect(await getterFacet.getClaims(poolParamsAfter.collateralToken, treasury.address)).to.eq(0);
                expect(await getterFacet.getClaims(poolParamsAfter.collateralToken, oracle.address)).to.eq(0);
                userCollateralTokenBalanceBefore = await collateralTokenInstance.balanceOf(user1.address);
                
                // ---------
                // Act: Add liquidity
                // ---------
                collateralToAdd = poolParamsBefore.collateralBalance
                expect(collateralToAdd).to.not.eq(0)
                await liquidityFacet.connect(user1).addLiquidity(poolId, collateralToAdd)

                // ---------
                // Assert: Check that pool parameters, the supply of short and long tokens and the user1's and diamond contract's balances have been updated correctly
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.collateralBalance).to.eq(poolParamsBefore.collateralBalance)
                expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(poolParamsBefore.supplyInitial)
                expect(await longTokenInstance.balanceOf(user1.address)).to.eq(poolParamsBefore.supplyInitial)
                expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralToAdd)
                expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(userCollateralTokenBalanceBefore.sub(collateralToAdd))
            })

            // -------------------------------------------
            // Events
            // -------------------------------------------

            it('Emits a LiquidityRemoved event', async () => {
                // ---------
                // Act: Remove liquidity
                // ---------
                await liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)

                // ---------
                // Assert: Check that LiquidityRemoved event is emitted
                // ---------
                const event = await liquidityRemovedEvent(liquidityFacet)
                expect(event.poolId).to.eq(poolId)
                expect(event.from).to.eq(user1.address)
                expect(event.collateralAmount).to.eq(collateralToReturnGross)
            })
            
            // -------------------------------------------
            // Reverts
            // -------------------------------------------

            it('Reverts if final reference value is already confirmed', async () => {
                // ---------
                // Arrange: Create an expired contingent pool and set final reference value
                // ---------
                await createContingentPool({
                    expiryTime: await getLastTimestamp()
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(await getLastTimestamp()).to.be.gte(poolParams.expiryTime)

                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0 // with that configuration, the first value submitted will be directly confirmed
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(poolParams.statusFinalReferenceValue).to.eq(3) // status changes to 3 = Confirmed

                // ---------
                // Act & Assert: Check that removing liquidity fails when the status is already Confirmed
                // ---------
                await expect(liquidityFacet.connect(user1).removeLiquidity(poolId, poolParamsBefore.supplyInitial)).to.be.revertedWith("DIVA: final value already confirmed");
            })
            
            it('Reverts if user tries to redeem more long tokens than there are in existence', async () => {
                // ---------
                // Arrange: Set amount of long tokens to redeem higher than total position token supply
                // ---------
                positionTokensToRedeem = (poolParamsBefore.supplyInitial).add(1)
                
                // ---------
                // Act & Assert: Check that remove liquidity fails
                // ---------
                await expect(liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)).to.be.revertedWith("DIVA: insufficient short or long token balance");
            })

            it('Reverts if user has insufficient long token balance', async () => {                
                // ---------
                // Arrange: Reduce user1's long token balance by sending 1 unit to user2
                // ---------
                userLongTokenBalance = await longTokenInstance.balanceOf(user1.address)
                await longTokenInstance.connect(user1).transfer(user2.address, 1)
                positionTokensToRedeem = userLongTokenBalance.add(1)

                // ---------
                // Act & Assert: Check that remove liquidity fails
                // ---------
                await expect(liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)).to.be.revertedWith("DIVA: insufficient short or long token balance");
            })

            it('Reverts if user has insufficient short token balance', async () => {
                // ---------
                // Arrange: Reduce user1's short token balance by sending all short tokens to user2
                // ---------
                userShortTokenBalance = await shortTokenInstance.balanceOf(user1.address)
                userLongTokenBalance = await longTokenInstance.balanceOf(user1.address)
                positionTokensToRedeem = userShortTokenBalance
                await shortTokenInstance.connect(user1).transfer(user2.address, userShortTokenBalance)

                // ---------
                // Act & Assert: Check that remove liquidity fails
                // ---------
                await expect(liquidityFacet.connect(user1).removeLiquidity(poolId, positionTokensToRedeem)).to.be.revertedWith("DIVA: insufficient short or long token balance");
            })

            it('Reverts if the removal of liquidity was paused', async () => {
                // ---------
                // Arrange: Pause the functionality to remove liquidity
                // ---------
                await governanceFacet.connect(contractOwner).setPauseReturnCollateral(true)
                govParams = await getterFacet.getGovernanceParameters()
                nextBlockTimestamp = (await getLastTimestamp()) + 1
                await setNextTimestamp(ethers.provider, nextBlockTimestamp)
                expect(govParams.pauseReturnCollateralUntil).to.be.gt(nextBlockTimestamp);
                
                // ---------
                // Act & Assert: Confirm that removal of liquidty is not possible if contract is paused
                // ---------
                await expect(liquidityFacet.connect(user2).removeLiquidity(poolId, 1)).to.be.revertedWith("DIVA: return collateral paused");
            })

        })

    });

  })
  