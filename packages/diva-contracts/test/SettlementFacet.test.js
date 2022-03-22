  const { statusChangedEvent, feeClaimAllocatedEvent } = require('./events')
  const { expect } = require('chai')
  const { ethers } = require('hardhat')
  const { BigNumber } = require('ethers')
  const { deployDiamond } = require('../scripts/deploy.js')
  const { erc20DeployFixture } = require("./fixtures/MockERC20Fixture")
  const { positionTokenAttachFixture } = require("./fixtures/PositionTokenFixture")
  const { fakePositionTokenDeployFixture } = require("./fixtures/FakePositionTokenFixture")
  const { parseEther, parseUnits, formatEthers, formatUnits } = require('@ethersproject/units')
  const { getExpiryInSeconds, getLastTimestamp, setNextTimestamp } = require('./utils.js')
  const { calcPayoffPerToken, calcPayout, calcFee } = require('./libDIVA.js')
  
  // -------
  // Input: Collateral token decimals (>= 3 && <= 18)
  // -------
  const decimals = 6

  describe('SettlementFacet', async function () {
    
    let diamondAddress
    let poolFacet, getterFacet, settlementFacet
    let contractOwner, treasury, oracle, user1, user2
    let collateralTokenInstance
    let submissionPeriod, challengePeriod, reviewPeriod, fallbackSubmissionPeriod
    let currentBlockTimestamp

    before(async function () {
      [contractOwner, treasury, oracle, fallbackOracle, user1, user2, ...accounts] = await ethers.getSigners(); // keep contractOwner and treasury at first two positions in line with deploy script
      
      // ---------
      // Setup: Deploy diamond contract (incl. facets) and connect to the diamond contract via facet specific ABI's
      // ---------
      diamondAddress = await deployDiamond();
      poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
      settlementFacet = await ethers.getContractAt('SettlementFacet', diamondAddress)
      getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
      claimFacet = await ethers.getContractAt('ClaimFacet', diamondAddress)
      governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)

      govParams = await getterFacet.getGovernanceParameters()
      submissionPeriod = govParams.submissionPeriod // 1d (initial value)
      challengePeriod = govParams.challengePeriod // 1d (initial value)
      reviewPeriod = govParams.reviewPeriod // 2d (initial value)
      fallbackSubmissionPeriod = govParams.fallbackSubmissionPeriod // 5d (initial value)

    });
  
    describe('settlement related functions', async () => {
        let user1StartCollateralTokenBalance;
        
        beforeEach(async () => {  
            // ---------
            // Arrange: Equip user1 with collateral tokens, approve collateral token for diamond contract, and specify default parameters for test
            // ---------
            user1StartCollateralTokenBalance = 100000;

            // Mint ERC20 collateral token with `decimals` decimals and send it to user 1
            collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", parseUnits(user1StartCollateralTokenBalance.toString(), decimals), user1.address, decimals);     
            
            // Set user1 allowances for Diamond contract
            await collateralTokenInstance.connect(user1).approve(diamondAddress, parseUnits(user1StartCollateralTokenBalance.toString(), decimals));
        
        });

        // Function to create contingent pools pre-populated with default values that can be overwritten depending on the test case 
        async function createContingentPool({ 
            referenceAsset = "BTC/USD",
            expiryTime = getExpiryInSeconds(0), 
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
  
        describe('setFinalReferenceValue', async () => { 
            beforeEach(async () => {                      
                // ---------
                // Arrange: Create an expired contingent pool with expiry equal to the current block timestamp
                // ---------
                currentBlockTimestamp = await getLastTimestamp() 
                await createContingentPool({
                    expiryTime: currentBlockTimestamp
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 

                // Set fallbackOracle as the fallback data provider
                await governanceFacet.connect(contractOwner).setFallbackDataProvider(fallbackOracle.address)
                    
            })
            
            
            // -------------------------------------------
            // Functionality
            // -------------------------------------------
        
            it('Should set the final value and update the status to 1 = Submitted when the data provider submits within the submission period and possibility to challenge is enabled', async () => { 
                // ---------
                // Arrange: Check that pool has expired, we are still within the submission period and no final value has been set yet
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0)

                // ---------
                // Act: Set final reference value and allow challenge
                // --------- 
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that the final reference value has been set and the status updated to 1 = Submitted
                // --------- 
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(finalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(1) // 1 = Submitted

            })

            it('Should set the final value and update the status to 3 = Confirmed when the data provider submits within the submission period and the possibility to challenge is disabled', async () => { 
                // ---------
                // Arrange: Check that pool has expired, we are still within the submission period and no final value has been set yet
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0)

                // ---------
                // Act: Set final reference value and DO NOT allow challenge
                // --------- 
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that the final reference value has been set and the status updated to 3 = Confirmed
                // --------- 
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(finalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed
            })

            describe('Tests requiring final value submission within the submission period without the possibility to challenge', async () => { 
                beforeEach(async () => { 
                    // ---------
                    // Arrange: Data provider submits a value during the submission period and disables the possibility to challenge
                    // ---------                                
                    expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                    submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                    expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                    expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                    expect(poolParamsBefore.finalReferenceValue).to.eq(0)

                    finalReferenceValue = parseEther("1605.33")
                    allowChallenge = 0
                    
                })

                it('Should set the redemption amounts for long and short token', async () => { 
                    // ---------
                    // Arrange: Check that both `redemptionAmountLongToken` and `redemptionAmountShortToken` are zero (initial state when pool is created)
                    // ---------
                    expect (poolParamsBefore.redemptionAmountLongToken).to.be.eq(0)
                    expect (poolParamsBefore.redemptionAmountShortToken).to.be.eq(0)

                    // ---------
                    // Act: Data provider confirms final reference value by submitting it and disabling the possibility to challenge
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption amount per long and short token (net of fees) is set correctly
                    // ---------
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsAfter.collateralBalanceLongInitial,
                        poolParamsAfter.collateralBalanceShortInitial,
                        poolParamsAfter.collateralBalance,
                        finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    
                    expect(poolParamsAfter.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    expect(poolParamsAfter.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)

                })

                it('Should allocate redemption fees to DIVA treasury', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    
                    // ---------
                    // Act: Data provider confirms final reference value by submitting it and disabling the possibility to challenge
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption fees have been allocated to the DIVA treasury
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    
                })

                it('Should allocate settlement fees to data provider', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                    
                    // ---------
                    // Act: Data provider confirms final reference value by submitting it and disabling the possibility to challenge
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the settlement fees have been allocated to the data provider
                    // --------- 
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);
                    
                })
            })
            
            it('Should allow the fallback data provider to set a final reference value during the fallback period', async () => { 
                // ---------
                // Arrange: Check that pool has expired and the submission period expired without any input
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod) // set submission period end
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open

                // ---------
                // Act: Fallback data provider submits a final value (enabling the possibility to challenge should not have any impact)
                // ---------   
                finalReferenceValue = parseEther("1688.17")
                allowChallenge = 1
                await setNextTimestamp(ethers.provider, (submissionPeriodEndTime.add(1)).toNumber()) // set timestamp of next block such that it's outside of the submission period and inside the fallback period
                await settlementFacet.connect(fallbackOracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that final value is confirmed and equal to finalReferenceValue 
                // ---------                   
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(finalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed
            })

            describe('Tests requiring to be within the fallback submission period', async () => { 
                beforeEach(async () => { 
                // ---------
                // Arrange: The submission period expired without any input and fallback data provider submits a value
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod) // set submission period end
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open

                finalReferenceValue = parseEther("1717.17")
                allowChallenge = 1 // is not relevant what to put here
                await setNextTimestamp(ethers.provider, (submissionPeriodEndTime.add(1)).toNumber()) // set timestamp of next block such that it's outside of the submission period and inside the fallback period
                    
                })

                it('Should set the redemption amounts for long and short token', async () => { 
                    // ---------
                    // Arrange: Check that both `redemptionAmountLongToken` and `redemptionAmountShortToken` are zero (initial state when pool is created)
                    // ---------
                    expect (poolParamsBefore.redemptionAmountLongToken).to.be.eq(0)
                    expect (poolParamsBefore.redemptionAmountShortToken).to.be.eq(0)
                    
                    // ---------
                    // Act: Fallback data provider submits final reference value and thereby confirms it
                    // --------- 
                    await settlementFacet.connect(fallbackOracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption amount per long and short token (net of fees) is set correctly
                    // ---------
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsAfter.collateralBalanceLongInitial,
                        poolParamsAfter.collateralBalanceShortInitial,
                        poolParamsAfter.collateralBalance,
                        finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )

                    expect(poolParamsAfter.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    expect(poolParamsAfter.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)

                })

                it('Should allocate redemption fees to DIVA treasury', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    
                    // ---------
                    // Act: Fallback data provider submits final reference value and thereby confirms it
                    // --------- 
                    await settlementFacet.connect(fallbackOracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption fees have been allocated to the DIVA treasury
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals) 
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    
                })

                it('Should allocate settlement fees to fallback data provider', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, fallbackOracle.address)).to.eq(0);
                    
                    // ---------
                    // Act: Fallback data provider submits final reference value and thereby confirms it
                    // --------- 
                    await settlementFacet.connect(fallbackOracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the settlement fees have been allocated to the fallback data provider
                    // --------- 
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, fallbackOracle.address)).to.eq(settlementFee);
                    
                })
            })
            
            it('Should set the final reference value equal to inflection if submission and fallback period expired without any input (can be triggered by any user)', async () => { 
                // ---------
                // Arrange: Check that pool has expired and both the submission and fallback period expired without any input
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                fallbackPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod).add(fallbackSubmissionPeriod) // set fallback period end
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open

                // ---------
                // Act: User1 triggers the `setFinalReferenceValue` function. `finalReferenceValue` and `allowChallenge` are required as inputs for `setFinalReferenceValue`, but their values don't matter in that particular scenario.
                // ---------   
                finalReferenceValue = parseEther("1688.17") 
                allowChallenge = 1 
                // Set timestamp of next block such that it's outside of the fallback submission period
                await setNextTimestamp(ethers.provider, (fallbackPeriodEndTime.add(1)).toNumber()) 
                await settlementFacet.connect(user1).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that final value is confirmed and equal to inflection 
                // ---------                   
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(poolParamsAfter.inflection)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed
            })

            describe('Tests requiring that both the submission and fallback submission period have passed', async () => { 
                beforeEach(async () => { 
                    // ---------
                    // Arrange: Pool expired and both the submission and fallback submission period have passed without any input
                    // ---------                                
                    expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                    fallbackPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod).add(fallbackSubmissionPeriod) // set fallback period end
                    expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                    expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open                
                    // `finalReferenceValue` and `allowChallenge` are required as inputs for `setFinalReferenceValue`, but their values don't matter in that particular scenario.
                    finalReferenceValue = parseEther("1.17") 
                    allowChallenge = 1 
                    // Set timestamp of next block such that it's outside of the fallback submission period
                    await setNextTimestamp(ethers.provider, (fallbackPeriodEndTime.add(1)).toNumber()) 

                })

                it('Should set the redemption amounts for long and short token', async () => { 
                    // ---------
                    // Arrange: Check that both `redemptionAmountLongToken` and `redemptionAmountShortToken` are zero (initial state when pool is created)
                    // ---------
                    expect (poolParamsBefore.redemptionAmountLongToken).to.be.eq(0)
                    expect (poolParamsBefore.redemptionAmountShortToken).to.be.eq(0)
                    
                    // ---------
                    // Act: User1 triggers the `setFinalReferenceValue` function. `finalReferenceValue` and `allowChallenge` are required as inputs for `setFinalReferenceValue`, but their values don't matter in that particular scenario.
                    // --------- 
                    await settlementFacet.connect(user1).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption amount per long and short token (net of fees) is set correctly
                    // ---------
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsAfter.collateralBalanceLongInitial,
                        poolParamsAfter.collateralBalanceShortInitial,
                        poolParamsAfter.collateralBalance,
                        poolParamsBefore.inflection,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    
                    expect(poolParamsAfter.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    expect(poolParamsAfter.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)

                })

                it('Should allocate both settlement and redemption fees to DIVA treasury', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    
                    // ---------
                    // Act: User1 triggers the `setFinalReferenceValue` function (value for `finalReferenceValue` and `allowChallenge` doesn't matter)
                    // --------- 
                    await settlementFacet.connect(user1).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that both redemption and settlement fees have been allocated to the DIVA treasury
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee.add(settlementFee));
                    
                })

            })

            it('Should confirm the final value when the data provider submits a value during the review period and disables the possibility to challenge', async () => {
                // ---------
                // Arrange: The data provider submits a value within the submission period and it gets challenged
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                // Data provider submits a value
                finalReferenceValue = parseEther("1700")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                // Position token holder (user1) challenges the submitted value
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                // Status gets updated to 2 = Challenged
                poolParams = await getterFacet.getPoolParameters(poolId)
                reviewPeriodEndTime = (poolParams.statusTimestamp).add(reviewPeriod)
                expect(poolParams.statusFinalReferenceValue).to.eq(2)

                // ---------
                // Act: The data provider submits a new value during review period and disables the possibility to challenge
                // ---------   
                finalReferenceValue = parseEther("1777") // value doesn't play a role here
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that final value is confirmed and equal 
                // ---------  
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(finalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed

            })

            describe('Tests requiring the data provider to confirm the value during the review period', async () => { 
                beforeEach(async () => { 
                    // ---------
                    // Arrange: The data provider submits a value within the submission period and it gets challenged
                    // ---------                                
                    expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                    submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                    expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                    // Data provider submits a value enabling the possibility to challenge it
                    finalReferenceValue = parseEther("1700")
                    allowChallenge = 1
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                    // Position token holder (user1) challenges the submitted value
                    await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                    // Status gets updated to 2 = Challenged
                    poolParams = await getterFacet.getPoolParameters(poolId)
                    reviewPeriodEndTime = (poolParams.statusTimestamp).add(reviewPeriod)
                    expect(poolParams.statusFinalReferenceValue).to.eq(2)

                    finalReferenceValue = parseEther("1777")
                    allowChallenge = 0

                })

                it('Should set the redemption amounts for long and short token', async () => { 
                    // ---------
                    // Arrange: Check that both `redemptionAmountLongToken` and `redemptionAmountShortToken` are zero (initial state when pool is created)
                    // ---------
                    expect (poolParamsBefore.redemptionAmountLongToken).to.be.eq(0)
                    expect (poolParamsBefore.redemptionAmountShortToken).to.be.eq(0)
                    
                    // ---------
                    // Act: Data provider triggers the `setFinalReferenceValue` function and disables the challenge functionality this time
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption amount per long and short token (net of fees) is set correctly
                    // ---------
                    poolId = await getterFacet.getLatestPoolId()
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsAfter.collateralBalanceLongInitial,
                        poolParamsAfter.collateralBalanceShortInitial,
                        poolParamsAfter.collateralBalance,
                        finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )

                    expect(poolParamsAfter.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    expect(poolParamsAfter.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)

                })

                it('Should allocate redemption fees to DIVA treasury', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    
                    // ---------
                    // Act: Data provider submits final reference value without the possibility to challenge it and thereby confirms it
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the redemption fees have been allocated to the DIVA treasury
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    
                })

                it('Should allocate settlement fees to fallback data provider', async () => { 
                    // ---------
                    // Arrange: Confirms that DIVA treasury fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                    
                    // ---------
                    // Act: Data provider submits final reference value without the possibility to challenge it and thereby confirms it
                    // --------- 
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                    // ---------
                    // Assert: Confirm that the settlement fees have been allocated to the fallback data provider
                    // --------- 
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);
                    
                })

            })

            it('Should confirm the final value when the data provider submits a THE SAME value as before during the review period', async () => {
                // ---------
                // Arrange: The data provider submits a value within the submission period and it gets challenged
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                // Data provider submits a value
                finalReferenceValue = parseEther("1700")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                // Position token holder (user1) challenges the submitted value
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                // Status gets updated to 2 = Challenged
                poolParams = await getterFacet.getPoolParameters(poolId)
                reviewPeriodEndTime = (poolParams.statusTimestamp).add(reviewPeriod)
                expect(poolParams.statusFinalReferenceValue).to.eq(2)

                // ---------
                // Act: The data provider submits THE SAME value as before during the review period
                // ---------   
                allowChallenge = 1 // shouldn't matter, but put to 1 to demonstrate that it doesn't impact the status
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that final value is confirmed and equal to the previously submitted value
                // ---------  
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(finalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed

            })

            it('Should set the status back to Submitted and update the final value when the data provider submits a NEW value during the review period', async () => {
                // ---------
                // Arrange: The data provider submits a value within the submission period and it gets challenged
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                // Data provider submits a value
                finalReferenceValue = parseEther("1700")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                // Position token holder (user1) challenges the submitted value
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                // Status gets updated to 2 = Challenged
                poolParams = await getterFacet.getPoolParameters(poolId)
                reviewPeriodEndTime = (poolParams.statusTimestamp).add(reviewPeriod)
                expect(poolParams.statusFinalReferenceValue).to.eq(2)

                // ---------
                // Act: The data provider submits a NEW value during the review period and enables the possibility to challenge
                // ---------   
                newFinalReferenceValue = parseEther("1800")
                expect(newFinalReferenceValue).to.not.eq(finalReferenceValue)
                allowChallenge = 1 
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, newFinalReferenceValue, allowChallenge)

                // ---------
                // Assert: Check that final value is set to 1 = Submitted and the final value is updated to the new value in the pool parameters
                // ---------  
                poolId = await getterFacet.getLatestPoolId()
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.finalReferenceValue).to.eq(newFinalReferenceValue)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(1) // 1 = Submitted

            })
        
            // -------------------------------------------
            // Events 
            // -------------------------------------------
        
            it('Emits a StatusChanged event', async () => {               
                // ---------
                // Act: Set final reference value
                // ---------
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                
                // ---------
                // Assert: Check that it emits a StatusChanged event
                // ---------
                const event = await statusChangedEvent(settlementFacet)
                expect(event.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed
                expect(event.by).to.eq(oracle.address)
                expect(event.poolId).to.eq(poolId)
                expect(event.proposedFinalReferenceValue).to.eq(finalReferenceValue)
            })

            it('Emits a FeeClaimAllocated event', async () => { 
                // ---------
                // Act: Set final reference value
                // ---------
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                
                // ---------
                // Assert: Check that it emits a FeeClaimAllocated event
                // ---------
                redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)

                const events = await feeClaimAllocatedEvent(settlementFacet)
                // Treasury fee allocation
                expect(events[0].args.poolId).to.eq(poolId)
                expect(events[0].args.recipient).to.eq(treasury.address)
                expect(events[0].args.amount).to.eq(redemptionFee)
                // Data provider fee allocation
                expect(events[1].args.poolId).to.eq(poolId)
                expect(events[1].args.recipient).to.eq(oracle.address)
                expect(events[1].args.amount).to.eq(settlementFee)
            })
        
            // -------------------------------------------
            // Reverts
            // -------------------------------------------

            it('Reverts if status is already submitted', async () => {
                // ---------
                // Arrange: Data provider submits a value for an already expired pool where a final value has been already submitted
                // ---------
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open
                // Data provider submits a value
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(1) // status changes to 1 = Submitted

                // ---------
                // Act & Assert: Check that data provider cannot submit another value
                // ---------
                finalReferenceValue = parseEther("1800")
                await expect(settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: already submitted/confirmed")

            })
            
            it('Reverts if status is already confirmed', async () => {
                // ---------
                // Arrange: Data provider submits a value for an already expired pool where a final value has been already confirmed
                // ---------
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open
                // Data provider submits a value
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0 // with that configuration, the first value submitted will be confirmed
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // status changes to 3 = Confirmed

                // ---------
                // Act & Assert: Check that data provider cannot submit another value
                // ---------
                finalReferenceValue = parseEther("1800")
                await expect(settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: already submitted/confirmed")

            })
   
            it('Reverts if pool hasn`t expired yet', async () => {
                // ---------
                // Arrange: Create a contingent pool with expiry time in the future
                // ---------
                await createContingentPool({
                    expiryTime: BigNumber.from(currentBlockTimestamp).add(1000)
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(await getLastTimestamp()).to.be.lt(poolParams.expiryTime) // < here as `require(block.timestamp >= _pool.expiryTime)` in code
                expect(poolParams.statusFinalReferenceValue).to.eq(0) // 0 = Open

                // ---------
                // Act & Assert: Check that setting final value fails when triggered before pool expiration
                // ---------
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await expect(settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: pool not expired")
                expect(await getLastTimestamp()).to.be.lt(poolParams.expiryTime) // < here as `require(block.timestamp >= _pool.expiryTime)` in code
            })

            it('Reverts if called by an account other than the data provider during the submission period', async () => {
                // ---------
                // Arrange: Check that pool has expired, we are still within the submission period and no final value has been submitted yet
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open

                // ---------
                // Act & Assert: Check that no account other than the data provider can submit a value
                // ---------
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await expect(settlementFacet.connect(user1).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: not data provider")

            })         
            
            it('Reverts if any account other than the fallback data provider submits a value within the fallback period', async () => {
                // ---------
                // Arrange: Check that pool has expired, the submission period expired without any submission
                // ---------                                
                expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod) // set submission period end
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(0) // no final value set yet
                expect(poolParamsBefore.finalReferenceValue).to.eq(0) // status is 0 = Open

                // ---------
                // Act & Assert: Check that no account other than the fallback data provider is able to submit a final value within the fallback period;
                // ---------   
                finalReferenceValue = parseEther("1605.33")
                allowChallenge = 0
                await setNextTimestamp(ethers.provider, (submissionPeriodEndTime.add(1)).toNumber()) // set timestamp of next block such that it's outside of the submission period and inside the fallback period
                await expect(settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: not fallback provider")
                await expect(settlementFacet.connect(user1).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: not fallback provider")

            })

            describe('Payoff calculations', async () => { 
                describe('floor = inflection = cap', async () => {

                    beforeEach(async () => {
                        // ---------
                        // Arrange: Create an expired contingent pool where floor = inflection = cap
                        // ---------
                        currentBlockTimestamp = await getLastTimestamp() 
                        await createContingentPool({
                            floor: 1600,
                            inflection: 1600,
                            cap: 1600,
                            collateralBalanceLong: 100,
                            collateralBalanceShort: 100,
                            supplyPositionToken: 100,
                            expiryTime: currentBlockTimestamp
                        })
                        poolId = await getterFacet.getLatestPoolId()
                        poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    })

                    it('Final reference value = inflection', async () => { 
                        // ---------
                        // Act: Set final reference value = inflection
                        // --------- 
                        finalReferenceValue = parseEther("1600") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceLong / supply) * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceShort / supply) * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value < inflection', async () => { 
                        // ---------
                        // Act: Set final reference value < inflection
                        // --------- 
                        finalReferenceValue = parseEther("1590") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0", decimals))
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value > inflection', async () => { 
                        // ---------
                        // Act: Set final reference value > inflection
                        // --------- 
                        finalReferenceValue = parseEther("1610") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0", decimals)) 
    
                    })

                })

                describe('floor = inflection = cap = 0', async () => {

                    beforeEach(async () => {
                        // ---------
                        // Arrange: Create an expired contingent pool where floor = inflection = cap
                        // ---------
                        currentBlockTimestamp = await getLastTimestamp() 
                        await createContingentPool({
                            floor: 0,
                            inflection: 0,
                            cap: 0,
                            collateralBalanceLong: 100,
                            collateralBalanceShort: 100,
                            supplyPositionToken: 100,
                            expiryTime: currentBlockTimestamp
                        })
                        poolId = await getterFacet.getLatestPoolId()
                        poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    })

                    it('Final reference value = inflection', async () => { 
                        // ---------
                        // Act: Set final reference value = inflection
                        // --------- 
                        finalReferenceValue = parseEther("0") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceLong / supply) * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceShort / supply) * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value > inflection', async () => { 
                        // ---------
                        // Act: Set final reference value > inflection
                        // --------- 
                        finalReferenceValue = parseEther("10") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0", decimals)) 
    
                    })

                })

                describe('floor = inflection < cap', async () => {

                    beforeEach(async () => {
                        // ---------
                        // Arrange: Create an expired contingent pool where floor = inflection < cap
                        // ---------
                        currentBlockTimestamp = await getLastTimestamp() 
                        await createContingentPool({
                            floor: 1600,
                            inflection: 1600,
                            cap: 1800,
                            collateralBalanceLong: 100,
                            collateralBalanceShort: 100,
                            supplyPositionToken: 100,
                            expiryTime: currentBlockTimestamp
                        })
                        poolId = await getterFacet.getLatestPoolId()
                        poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    })

                    it('Final reference value = inflection', async () => { 
                        // ---------
                        // Act: Set final reference value = inflection
                        // --------- 
                        finalReferenceValue = parseEther("1600") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceLong / supply) * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceShort / supply) * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value < inflection', async () => { 
                        // ---------
                        // Act: Set final reference value < inflection
                        // --------- 
                        finalReferenceValue = parseEther("1590") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0", decimals))
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
    
                    })

                    it('Cap > final reference value > inflection', async () => { 
                        // ---------
                        // Act: Set final reference value such that cap > final reference value > inflection
                        // --------- 
                        finalReferenceValue = parseEther("1700") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.4955", decimals)) // (0.5 * collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0.4985", decimals)) // (0.5 * collateralBalanceShort) / supply * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value = cap', async () => { 
                        // ---------
                        // Act: Set final reference value = cap
                        // --------- 
                        finalReferenceValue = parseEther("1800") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0", decimals)) 
    
                    })

                    it('Final reference value > cap', async () => { 
                        // ---------
                        // Act: Set final reference value > cap
                        // --------- 
                        finalReferenceValue = parseEther("1810") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0", decimals)) 
    
                    })

                })

                describe('Floor < inflection = cap', async () => {

                    beforeEach(async () => {
                        // ---------
                        // Arrange: Create an expired contingent pool where floor < inflection = cap
                        // ---------
                        currentBlockTimestamp = await getLastTimestamp() 
                        await createContingentPool({
                            floor: 1400,
                            inflection: 1600,
                            cap: 1600,
                            collateralBalanceLong: 100,
                            collateralBalanceShort: 100,
                            supplyPositionToken: 100,
                            expiryTime: currentBlockTimestamp
                        })
                        poolId = await getterFacet.getLatestPoolId()
                        poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    })

                    it('Final reference value = inflection', async () => { 
                        // ---------
                        // Act: Set final reference value = inflection
                        // --------- 
                        finalReferenceValue = parseEther("1600") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceLong / supply) * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0.997", decimals)) // (collateralBalanceShort / supply) * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value > cap', async () => { 
                        // ---------
                        // Act: Set final reference value > cap
                        // --------- 
                        finalReferenceValue = parseEther("1610") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("0", decimals)) 
    
                    })

                    it('Floor < final reference value < inflection', async () => { 
                        // ---------
                        // Act: Set final reference value such that floor < final reference value < inflection
                        // --------- 
                        finalReferenceValue = parseEther("1500") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0.4985", decimals)) // (0.5 * collateralBalanceLong) / supply * ( 1- 0.3% fee)
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("1.4955", decimals)) // (0.5 * collateralBalanceLong + collateralBalanceShort) / supply * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value = floor', async () => {  
                        // ---------
                        // Act: Set final reference value = floor
                        // --------- 
                        finalReferenceValue = parseEther("1400") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0", decimals)) 
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
    
                    })

                    it('Final reference value < floor', async () => {  
                        // ---------
                        // Act: Set final reference value < floor
                        // --------- 
                        finalReferenceValue = parseEther("1") 
                        allowChallenge = 0
                        await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
    
                        // ---------
                        // Assert: Confirm that redemption amounts (net of fees) are correct 
                        // ---------
                        poolParamsAfter = await getterFacet.getPoolParameters(poolId)                        
                        expect(poolParamsAfter.redemptionAmountLongToken).to.eq(parseUnits("0", decimals)) 
                        expect(poolParamsAfter.redemptionAmountShortToken).to.eq(parseUnits("1.994", decimals)) // (collateralBalanceShort + collateralBalanceLong) / supply * ( 1- 0.3% fee)
    
                    })

                })
                
            })

            describe('Reverts that require status = Challenged', async () => { 
                beforeEach(async () => {      
                    // ---------
                    // Arrange: The data provider submits a value within the submission period and the value gets challenged
                    // ---------                                
                    expect(poolParamsBefore.expiryTime).to.be.lte(currentBlockTimestamp) // pool expired
                    submissionPeriodEndTime = (poolParamsBefore.expiryTime).add(submissionPeriod)
                    expect(currentBlockTimestamp).to.be.lte(submissionPeriodEndTime) // still within submission period
                    // Data provider submits value
                    finalReferenceValue = parseEther("1700")
                    allowChallenge = 1
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                    // Position token holder (user1) challenges the submitted value
                    await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                    // Status gets updated to 2 = Challenged
                    poolParams = await getterFacet.getPoolParameters(poolId)
                    reviewPeriodEndTime = (poolParams.statusTimestamp).add(reviewPeriod)
                    expect(poolParams.statusFinalReferenceValue).to.eq(2)
                })

                it('Reverts if data provider tries to submit a value after the review period expired', async () => { 
                    // ---------
                    // Arrange: Advance time to simulate that the review period expired without any input from the data provider
                    // ---------
                    await setNextTimestamp(ethers.provider, (reviewPeriodEndTime.add(1)).toNumber()) 
                    
                    // ---------
                    // Act & Assert: Confirm that data provider is not able to submit a final value after the review period expired
                    // ---------   
                    await expect(settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: review period expired")
    
                })

                it('Reverts if an account other than the data provider tries to submit a value within the review period', async () => { 
                    // ---------
                    // Arrange: Check that we are still within the review period
                    // ---------
                    expect(await getLastTimestamp()).to.lte(reviewPeriodEndTime)
                    
                    // ---------
                    // Act & Assert: Confirm that no account other than the data provider can submit a value within the review period
                    // ---------   
                    await expect(settlementFacet.connect(user2).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: not data provider")
                    await expect(settlementFacet.connect(fallbackOracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)).to.be.revertedWith("DIVA: not data provider")
    
                })   

            })
            
            
        })

        describe('challengeFinalReferenceValue', async () => {                       
            beforeEach(async () => {      
                
                // ---------
                // Arrange: Create an expired contingent pool with expiry equal to the current block timestamp. User1 is the default pool creator
                // ---------
                currentBlockTimestamp = await getLastTimestamp() 
                await createContingentPool({
                    expiryTime: currentBlockTimestamp
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                shortTokenInstance = await positionTokenAttachFixture(poolParamsBefore.shortToken)
                longTokenInstance = await positionTokenAttachFixture(poolParamsBefore.longToken)

                // Data provider submits value and enables the possibility to challenge
                finalReferenceValue = parseEther("1715.18")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParamsBefore = await getterFacet.getPoolParameters(poolId) 

                    
            })
      
            // -------------------------------------------
            // Functionality
            // -------------------------------------------
            it('Allows to challenge at the very end of the challenge period', async () => {
                // ---------
                // Arrange: Set timestamp of next block equal to the end of the challenge period
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge = challengePeriodEndTime 
                await setNextTimestamp(ethers.provider, timeOfChallenge.toNumber())

                // ---------
                // Act: Challenge final reference value
                // ---------
                proposedFinalReferenceValue = parseEther("1700.27") // Value is not stored anywhere but emitted as part of the StatusChanged event
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)
        
                // ---------
                // Assert: Confirm that status and timestamp are updated but final reference value remains unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(2); // Challenged
                expect(poolParamsAfter.statusTimestamp).to.eq(timeOfChallenge); // Timestamp updated
                expect(poolParamsAfter.finalReferenceValue).to.eq(poolParamsBefore.finalReferenceValue) // Final reference value doesn't change
                
            })

            it('Allows to challenge one second after the start of the challenge period', async () => {
                // ---------
                // Arrange: Set timestamp of next block one second after the start of the challenge period (< end of challenge period)
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge = (poolParamsBefore.statusTimestamp).add(1) // 1 sec after submission (= start of challenged period)
                expect(timeOfChallenge).to.be.lt(challengePeriodEndTime) // still within challenge period
                await setNextTimestamp(ethers.provider, timeOfChallenge.toNumber())

                // ---------
                // Act: Challenge final reference value
                // ---------
                proposedFinalReferenceValue = parseEther("1700.27") // Value is not stored anywhere but emitted as part of the StatusChanged event
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)
        
                // ---------
                // Assert: Confirm that status and timestamp are updated but final reference value remains unchanged
                // ---------
                poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter.statusFinalReferenceValue).to.eq(2); // Challenged
                expect(poolParamsAfter.statusTimestamp).to.eq(timeOfChallenge); // Timestamp updated
                expect(poolParamsAfter.finalReferenceValue).to.eq(poolParamsBefore.finalReferenceValue) // Final reference value remains unchanged
                
            })

            it('Allows to submit a second challenge at the very end of the review period', async () => {
                // ---------
                // Arrange: Challenge once and prepare for a second challenge within the review period
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                // Challenge 1
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge1 = (poolParamsBefore.statusTimestamp).add(1) // 1 sec after submission
                expect(timeOfChallenge1).to.be.lte(challengePeriodEndTime) // still within challenge period
                await setNextTimestamp(ethers.provider, timeOfChallenge1.toNumber())
                
                proposedFinalReferenceValue1 = parseEther("1700.27") // Value is not stored anywhere but emitted as part of the StatusChanged event
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue1)
                
                poolParamsAfter1 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter1.statusFinalReferenceValue).to.eq(2); // Challenged
                
                // Prepare challenge 2
                reviewPeriodEndTime = (poolParamsAfter1.statusTimestamp).add(reviewPeriod)
                timeOfChallenge2 = reviewPeriodEndTime 
                await setNextTimestamp(ethers.provider, reviewPeriodEndTime.toNumber())
        
                // ---------
                // Act: Second challenge of final reference value
                // ---------
                proposedFinalReferenceValue2 = parseEther("1700.27") 
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue2)

                // ---------
                // Assert: Confirm that status, timestamp and final reference value remain unchanged
                // ---------
                poolParamsAfter2 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter2.statusFinalReferenceValue).to.eq(poolParamsAfter1.statusFinalReferenceValue); // Status unchanged
                expect(poolParamsAfter2.statusTimestamp).to.eq(poolParamsAfter1.statusTimestamp); // Timestamp unchanged
                expect(poolParamsAfter2.finalReferenceValue).to.eq(poolParamsAfter1.finalReferenceValue) // Final reference value unchanged
                
            })

            it('Allows to submit a second challenge one second after the start of the review period', async () => {
                // ---------
                // Arrange: Challenge once and prepare for a second challenge within the review period
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                // Challenge 1
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge1 = (poolParamsBefore.statusTimestamp).add(1) // 1 sec after submission (= start of challenge period)
                expect(timeOfChallenge1).to.be.lte(challengePeriodEndTime) // still within challenge period
                await setNextTimestamp(ethers.provider, timeOfChallenge1.toNumber())
                
                proposedFinalReferenceValue1 = parseEther("1700.27") // Value is not stored anywhere but emitted as part of the StatusChanged event
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue1)
                
                poolParamsAfter1 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter1.statusFinalReferenceValue).to.eq(2); // Challenged
                
                // Prepare challenge 2
                reviewPeriodEndTime = (poolParamsAfter1.statusTimestamp).add(reviewPeriod)
                timeOfChallenge2 = (poolParamsAfter1.statusTimestamp).add(1) // 1 sec after start of review period
                expect(timeOfChallenge2).to.be.lt(reviewPeriodEndTime) // still within review period
                await setNextTimestamp(ethers.provider, reviewPeriodEndTime.toNumber())
        
                // ---------
                // Act: Execute challenge 2
                // ---------
                proposedFinalReferenceValue2 = parseEther("1700.27") 
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue2)

                // ---------
                // Assert: Confirm that status, timestamp and final reference value remain unchanged
                // ---------
                poolParamsAfter2 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter2.statusFinalReferenceValue).to.eq(poolParamsAfter1.statusFinalReferenceValue); // Status unchanged
                expect(poolParamsAfter2.statusTimestamp).to.eq(poolParamsAfter1.statusTimestamp); // Timestamp unchanged
                expect(poolParamsAfter2.finalReferenceValue).to.eq(poolParamsAfter1.finalReferenceValue) // Final reference value unchanged
                
            })


            // -------------------------------------------
            // Events
            // -------------------------------------------

            it('Emits a StatusChanged event when status switches from Submitted to Challenged', async () => {
                // ---------
                // Act: Challenge final reference value
                // ---------
                proposedFinalReferenceValue = parseEther("1700.27")
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)
                
                // ---------
                // Assert: Check that it emits a StatusChanged event
                // ---------
                const event = await statusChangedEvent(settlementFacet)
                expect(event.statusFinalReferenceValue).to.eq(2) // 2 = Challenged
                expect(event.by).to.eq(user1.address)
                expect(event.poolId).to.eq(poolId)
                expect(event.proposedFinalReferenceValue).to.eq(proposedFinalReferenceValue)
            })

            it('Emits a StatusChanged event when a second challenge is submitted during the review period', async () => {
                // ---------
                // Arrange: First challenge of final reference value
                // ---------
                proposedFinalReferenceValue1 = parseEther("1700.27")
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue1)
                poolParamsAfter1 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter1.statusFinalReferenceValue).to.eq(2) // Challenged
                
                // ---------
                // Act: Second challenge of final reference value
                // ---------
                proposedFinalReferenceValue2 = parseEther("1800.03")
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue2)

                // ---------
                // Assert: Check that StatusChanged event is emitted
                // ---------
                const event = await statusChangedEvent(settlementFacet)
                expect(event.statusFinalReferenceValue).to.eq(2) // 2 = Challenged
                expect(event.by).to.eq(user1.address)
                expect(event.poolId).to.eq(poolId)
                expect(event.proposedFinalReferenceValue).to.eq(proposedFinalReferenceValue2)
            })
            
            // -------------------------------------------
            // Reverts
            // -------------------------------------------

            it('Reverts if user doesn`t hold any position tokens', async () => {
                // ---------
                // Arrange: Confirm that user2 does not own any long or short tokens
                // ---------
                expect(await shortTokenInstance.balanceOf(user2.address)).to.eq(0)
                expect(await longTokenInstance.balanceOf(user2.address)).to.eq(0)

                // ---------
                // Act & Assert: Check that user2 cannot submit a challenge
                // ---------
                proposedFinalReferenceValue = parseEther("1800.03")
                await expect(settlementFacet.connect(user2).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)).to.be.revertedWith("DIVA: no position tokens")
            })

            it('Reverts if challenge period has passed', async () => {
                // ---------
                // Arrange: Set block timestamp 1 sec after challenge period end
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge = (challengePeriodEndTime).add(1) // 1 sec after challenge period end
                await setNextTimestamp(ethers.provider, timeOfChallenge.toNumber())

                // ---------
                // Act & Assert: Check that user1 cannot submit a challenge after the challenge period has passed
                // ---------
                await expect(settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)).to.be.revertedWith("DIVA: outside of challenge period")
            })

            it('Reverts if second challenge is outside of review period', async () => {
                // ---------
                // Arrange: Challenge once and set block timestamp 1 sec after review period end
                // ---------
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1); // Submitted
                // Challenge 1
                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                timeOfChallenge1 = (poolParamsBefore.statusTimestamp).add(1) // 1 sec after submission (= start of challenge period)
                expect(timeOfChallenge1).to.be.lte(challengePeriodEndTime) // still within challenge period
                await setNextTimestamp(ethers.provider, timeOfChallenge1.toNumber())
                
                proposedFinalReferenceValue1 = parseEther("1700.27") // Value is not stored anywhere but emitted as part of the StatusChanged event
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue1)
                
                poolParamsAfter1 = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsAfter1.statusFinalReferenceValue).to.eq(2); // Challenged
                
                // Prepare challenge 2 
                reviewPeriodEndTime = (poolParamsAfter1.statusTimestamp).add(reviewPeriod)
                timeOfChallenge2 = (reviewPeriodEndTime).add(1) // 1 sec after review period end
                await setNextTimestamp(ethers.provider, timeOfChallenge2.toNumber())

                // ---------
                // Act & Assert: Check that challenge reverts if triggered after the end of the review period
                // ---------
                proposedFinalReferenceValue2 = parseEther("1650.27") 
                await expect(settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue2)).to.be.revertedWith("DIVA: outside of review period")
            })

            it('Reverts if status is Open', async () => {
                // ---------
                // Arrange: Create a pool where no value has been submitted yet, i.e. status is Open
                // ---------
                currentBlockTimestamp = await getLastTimestamp() 
                await createContingentPool({
                    expiryTime: currentBlockTimestamp
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(poolParams.statusFinalReferenceValue).to.eq(0) // Open
                
                // ---------
                // Act & Assert: Check that user cannot challenge if status of final reference value is Open
                // ---------
                proposedFinalReferenceValue = parseEther("1650.27") 
                await expect(settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)).to.be.revertedWith("DIVA: nothing to challenge")
            })

            it('Reverts if status is Confirmed', async () => {
                // ---------
                // Arrange: Create a pool and confirm final reference value
                // ---------
                currentBlockTimestamp = await getLastTimestamp() 
                await createContingentPool({
                    expiryTime: currentBlockTimestamp
                })
                poolId = await getterFacet.getLatestPoolId()

                // Data provider submits and confirms value by disabling a challenge
                finalReferenceValue = parseEther("100.33")
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParams = await getterFacet.getPoolParameters(poolId)
                expect(poolParams.statusFinalReferenceValue).to.eq(3) // confirmed

                // ---------
                // Act & Assert: Check that user cannot challenge if status of final reference value is Open
                // ---------
                proposedFinalReferenceValue = parseEther("1650.27") 
                await expect(settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, proposedFinalReferenceValue)).to.be.revertedWith("DIVA: nothing to challenge")
            })

        })

        describe('redeemPositionToken', async () => {                    
            beforeEach(async () => {      
                
                // ---------
                // Arrange: Create contingent pool with expiry equal to the current block timestamp
                // ---------
                currentBlockTimestamp = await getLastTimestamp()
                await createContingentPool({
                    expiryTime: currentBlockTimestamp
                })
                poolId = await getterFacet.getLatestPoolId()
                poolParams = await getterFacet.getPoolParameters(poolId) 
                shortTokenInstance = await positionTokenAttachFixture(poolParams.shortToken)
                longTokenInstance = await positionTokenAttachFixture(poolParams.longToken)
                collateralTokenInstance = await positionTokenAttachFixture(poolParams.collateralToken)
                    
            })
      
            // -------------------------------------------
            // Functionality
            // -------------------------------------------
            describe('redeemPositionToken where final value is already confirmed', async () => { 
                beforeEach(async () => {      
                    // ---------
                    // Arrange: Note that fees are already deducated after `setFinalReferenceValue`.
                    // ---------
                    finalReferenceValue = parseEther("1700")
                    allowChallenge = 0
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge) 
                    // Note that fees have been subtracted
                    poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
                    expect(poolParamsBefore.statusFinalReferenceValue).to.eq(3)
                    shortTokenBalanceBefore = await shortTokenInstance.balanceOf(user1.address)
                    longTokenBalanceBefore = await longTokenInstance.balanceOf(user1.address)
    
                })
                
                it('Reduces the short token supply to zero if user redeems all their short tokens', async () => {
                    // ---------
                    // Arrange: Confirm that short token balance is equal to `shortTokenBalanceBefore` (>0 ensured insided `createContingentPool`)
                    // ---------
                    expect(await shortTokenInstance.totalSupply()).to.eq(shortTokenBalanceBefore)

                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Short token supply is reduced
                    // ---------
                    expect(await shortTokenInstance.totalSupply()).to.eq(0)
                })

                it('Reduces the short token supply if user redeems all short tokens except for one', async () => {
                    // ---------
                    // Arrange: Confirm that short token balance is equal to `shortTokenBalanceBefore` (>0 ensured insided `createContingentPool`)
                    // ---------
                    expect(await shortTokenInstance.totalSupply()).to.eq(shortTokenBalanceBefore)

                    // ---------
                    // Act: User redeems all short position tokens except for one
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore.sub(1)
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Short token supply is reduced
                    // ---------
                    expect(await shortTokenInstance.totalSupply()).to.eq(1)
                })

                it('Reduces the collateral balance of the diamond contract after ALL short tokens have been redeemed', async () => {
                    // ---------
                    // Arrange: Get collateral token balance of diamond contract before short tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceDiamondBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                    expect(collateralTokenBalanceDiamondBefore).to.be.gt(0)
                    tokensToRedeem = shortTokenBalanceBefore
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerShortToken, tokensToRedeem, decimals)

                    // ---------
                    // Act: Redeem short position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
                    
                    // ---------
                    // Assert: Check that the collateral token balance of the diamond contract and collateralBalance in pool parameters are reduced by `totalPayout`
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralTokenBalanceDiamondBefore.sub(totalPayout))
                    expect(poolParamsAfter.collateralBalance).to.eq((poolParamsBefore.collateralBalance).sub(totalPayout))

                })

                it('Reduces the collateral balance of the diamond contract after HALF of the short tokens have been redeemed', async () => {
                    // ---------
                    // Arrange: Get collateral token balance of diamond contract before short tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceDiamondBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                    expect(collateralTokenBalanceDiamondBefore).to.be.gt(0)
                    tokensToRedeem = shortTokenBalanceBefore.div(2)
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerShortToken, tokensToRedeem, decimals)

                    // ---------
                    // Act: Redeem short position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
                    
                    // ---------
                    // Assert: Check that the collateral token balance of the diamond contract and collateralBalance in pool parameters are reduced by `totalPayout`
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralTokenBalanceDiamondBefore.sub(totalPayout))
                    expect(poolParamsAfter.collateralBalance).to.eq((poolParamsBefore.collateralBalance).sub(totalPayout))

                })

                it('Reduces the user`s short token balance to zero if user redeems ALL their short tokens', async () => {
                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: User's short token balance is reduced to zero
                    // ---------
                    expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(0)
                })

                it('Reduces the user`s short token balance if user redeems HALF of their short tokens', async () => {
                    // ---------
                    // Act: User redeems half of their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore.div(2)
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: User's short token balance is reduced by `tokensToRedeem`
                    // ---------
                    expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(shortTokenBalanceBefore.sub(tokensToRedeem))
                })

                it('Increases the users collateral token balance if ALL short tokens are redeemed', async () => {
                    // ---------
                    // Arrange: Get user's collateral token balance before short tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceUserBefore = await collateralTokenInstance.balanceOf(user1.address)
                    tokensToRedeem = shortTokenBalanceBefore
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerShortToken, tokensToRedeem, decimals)
                    
                    // ---------
                    // Act: User redeems all of their short position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that user's collateral token balance increases by `totalPayout`
                    // ---------
                    expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(collateralTokenBalanceUserBefore.add(totalPayout))
                })

                it('Increases the users collateral token balance if HALF of their short tokens are redeemed', async () => {
                    // ---------
                    // Arrange: Get user's collateral token balance before short tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceUserBefore = await collateralTokenInstance.balanceOf(user1.address)
                    tokensToRedeem = shortTokenBalanceBefore.div(2)
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerShortToken, tokensToRedeem, decimals)
                    
                    // ---------
                    // Act: User redeems half of their short position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that user's collateral token balance increases by `totalPayout`
                    // ---------
                    expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(collateralTokenBalanceUserBefore.add(totalPayout))
                })

                // ---------
                // Same tests but with long instead of short tokens
                // ---------
                it('Reduces the long token supply to zero if user redeems all their long tokens', async () => {
                    // ---------
                    // Arrange: Confirm that long token balance is equal to `longTokenBalanceBefore` (>0 ensured inside `createContingentPool`)
                    // ---------
                    expect(await longTokenInstance.totalSupply()).to.eq(longTokenBalanceBefore)
                    
                    // ---------
                    // Act: User redeems all their long position tokens
                    // ---------
                    tokensToRedeem = longTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Long token supply is reduced
                    // ---------
                    expect(await longTokenInstance.totalSupply()).to.eq(0)
                })

                it('Reduces the long token supply if user redeems all long tokens except for one', async () => {
                    // ---------
                    // Arrange: Confirm that long token balance is equal to `longTokenBalanceBefore` (>0 ensured inside `createContingentPool`)
                    // ---------
                    expect(await longTokenInstance.totalSupply()).to.eq(longTokenBalanceBefore)
                    
                    // ---------
                    // Act: User redeems all long position tokens except for one
                    // ---------
                    tokensToRedeem = longTokenBalanceBefore.sub(1)
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Long token supply is reduced
                    // ---------
                    expect(await longTokenInstance.totalSupply()).to.eq(1)
                })

                it('Reduces the collateral balance of the diamond contract after ALL long tokens have been redeemed', async () => {
                    // ---------
                    // Arrange: Get collateral token balance of diamond contract before long tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceDiamondBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                    expect(collateralTokenBalanceDiamondBefore).to.be.gt(0)
                    tokensToRedeem = longTokenBalanceBefore
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerLongToken, tokensToRedeem, decimals)

                    // ---------
                    // Act: Redeem long position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
                    
                    // ---------
                    // Assert: Check that the collateral token balance of the diamond contract and collateralBalance in pool parameters are reduced by `totalPayout`
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId) 
                    expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralTokenBalanceDiamondBefore.sub(totalPayout))
                    expect(poolParamsAfter.collateralBalance).to.eq((poolParamsBefore.collateralBalance).sub(totalPayout))

                })

                it('Reduces the collateral balance of the diamond contract after HALF of the long tokens have been redeemed', async () => {
                    // ---------
                    // Arrange: Get collateral token balance of diamond contract before long tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceDiamondBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                    expect(collateralTokenBalanceDiamondBefore).to.be.gt(0)
                    tokensToRedeem = longTokenBalanceBefore.div(2)
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerLongToken, tokensToRedeem, decimals)

                    // ---------
                    // Act: Redeem long position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
                    
                    // ---------
                    // Assert: Check that the collateral token balance of the diamond contract and collateralBalance in pool parameters are reduced by `totalPayout`
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId) 
                    expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralTokenBalanceDiamondBefore.sub(totalPayout))
                    expect(poolParamsAfter.collateralBalance).to.eq((poolParamsBefore.collateralBalance).sub(totalPayout))

                })

                it('Reduces the user`s long token balance to zero if user redeems ALL their long tokens', async () => {
                    // ---------
                    // Act: User redeems all their long position tokens
                    // ---------
                    tokensToRedeem = longTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: User's long token balance is reduced to zero
                    // ---------
                    expect(await longTokenInstance.balanceOf(user1.address)).to.eq(0)
                })

                it('Reduces the user`s long token balance if user redeems HALF of their long tokens', async () => {
                    // ---------
                    // Act: User redeems half of their long position tokens
                    // ---------
                    tokensToRedeem = longTokenBalanceBefore.div(2)
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: User's long token balance is reduced by `tokensToRedeem`
                    // ---------
                    expect(await longTokenInstance.balanceOf(user1.address)).to.eq(longTokenBalanceBefore.sub(tokensToRedeem))
                })

                it('Increases the users collateral token balance if ALL long tokens are redeemed', async () => {
                    // ---------
                    // Arrange: Get user's collateral token balance before long tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceUserBefore = await collateralTokenInstance.balanceOf(user1.address)
                    tokensToRedeem = longTokenBalanceBefore
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerLongToken, tokensToRedeem, decimals)
                    
                    // ---------
                    // Act: User redeems all of their long position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that user's collateral token balance increases by `totalPayout`
                    // ---------
                    expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(collateralTokenBalanceUserBefore.add(totalPayout))
                })

                it('Increases the users collateral token balance if HALF of their long tokens are redeemed', async () => {
                    // ---------
                    // Arrange: Get user's collateral token balance before long tokens are redeemed, calculate collateral to return
                    // ---------
                    collateralTokenBalanceUserBefore = await collateralTokenInstance.balanceOf(user1.address)
                    tokensToRedeem = longTokenBalanceBefore.div(2)
                    // Note that `poolParamsBefore.collateralBalance` is already after fees
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsBefore.collateralBalanceLongInitial,
                        poolParamsBefore.collateralBalanceShortInitial,
                        poolParamsBefore.collateralBalance,
                        poolParamsBefore.finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    expect(poolParamsBefore.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    totalPayout = calcPayout(payoffsPerToken.payoffPerLongToken, tokensToRedeem, decimals)
                    
                    // ---------
                    // Act: User redeems half of their long position tokens
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that user's collateral token balance increases by `totalPayout`
                    // ---------
                    expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(collateralTokenBalanceUserBefore.add(totalPayout))
                })

                it('Returns zero collateral if zero `_amount` is passed as argument', async () => {
                    // ---------
                    // Arrange: Confirm that user1 owns short position tokens
                    // ---------
                    expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(poolParamsBefore.supplyInitial)
                    collateralTokenBalanceDiamondBefore = await collateralTokenInstance.balanceOf(diamondAddress)
                    collateralTokenBalanceUserBefore = await collateralTokenInstance.balanceOf(user1.address)

                    // ---------
                    // Act: User1 redeems short position tokens but submits 0 amount
                    // ---------
                    tokensToRedeem = 0
                    await settlementFacet.connect(user1).redeemPositionToken(poolParamsBefore.shortToken, tokensToRedeem)

                    // ---------
                    // Assert: Check that nothing has changed
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    expect(poolParamsAfter.collateralBalance).to.eq(poolParamsBefore.collateralBalance)
                    expect(await shortTokenInstance.balanceOf(user1.address)).to.eq(poolParamsAfter.supplyInitial)
                    expect(await shortTokenInstance.totalSupply()).to.eq(poolParamsBefore.supplyInitial)
                    expect(await collateralTokenInstance.balanceOf(diamondAddress)).to.eq(collateralTokenBalanceDiamondBefore)
                    expect(await collateralTokenInstance.balanceOf(user1.address)).to.eq(collateralTokenBalanceUserBefore)

                })

                // -------------------------------------------
                // Reverts 
                // -------------------------------------------
                it('Reverts if user has sufficient short position tokens', async () => {
                    // ---------
                    // Arrange: Confirm that user2 has no short position tokens
                    // ---------
                    expect(await shortTokenInstance.balanceOf(user2.address)).to.eq(0)
                    // ---------
                    // Act & Assert: User2 tries to redeem short position tokens
                    // ---------
                    await expect(settlementFacet.connect(user2).redeemPositionToken(poolParamsBefore.shortToken, 1)).to.be.revertedWith("ERC20: burn amount exceeds balance")
                })

                it('Reverts if user has sufficient long position tokens', async () => {
                    // ---------
                    // Arrange: Confirm that user2 has no long position tokens
                    // ---------
                    expect(await longTokenInstance.balanceOf(user2.address)).to.eq(0)
                    // ---------
                    // Act & Assert: User2 tries to redeem long position tokens
                    // ---------
                    await expect(settlementFacet.connect(user2).redeemPositionToken(poolParamsBefore.longToken, 1)).to.be.revertedWith("ERC20: burn amount exceeds balance")
                })

                it('Reverts if the redemption was paused', async () => {
                    // ---------
                    // Arrange: Pause the functionality to redeem position tokens
                    // ---------
                    await governanceFacet.connect(contractOwner).setPauseReturnCollateral(true)
                    govParams = await getterFacet.getGovernanceParameters()
                    nextBlockTimestamp = (await getLastTimestamp()) + 1
                    await setNextTimestamp(ethers.provider, nextBlockTimestamp)
                    expect(govParams.pauseReturnCollateralUntil).to.be.gt(nextBlockTimestamp);
                    
                    // ---------
                    // Act & Assert: Confirm that the redemption of position tokens is not possible if contract is paused
                    // ---------
                    await expect(settlementFacet.connect(user1).redeemPositionToken(poolParamsBefore.longToken, 1)).to.be.revertedWith("DIVA: return collateral paused");

                    // ---------
                    // Reset: Unpause again so that the remaining tests go through
                    // ---------
                    await governanceFacet.connect(contractOwner).setPauseReturnCollateral(false)
                })

            })

            describe('redeemPositionToken where final value was submitted and not challenged', async () => { 
                beforeEach(async () => {      
                    // ---------
                    // Arrange: Data provider submits and it doesn't get challenged. 
                    // Given that the value has not been confiremd yet, fees were not allocated yet.
                    // ---------
                    finalReferenceValue = parseEther("1700")
                    allowChallenge = 1
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge) 
                    poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                    await setNextTimestamp(ethers.provider, (challengePeriodEndTime.add(1)).toNumber()) // fast forward time to the end of the challenge period
                    // Note that fees have been subtracted
                    expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1)
                    shortTokenBalanceBefore = await shortTokenInstance.balanceOf(user1.address)
                    longTokenBalanceBefore = await longTokenInstance.balanceOf(user1.address)

                })

                it('Confirms final reference value on first redeem after challenge period expired without a challenge', async () => {
                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that status of final reference value is confirmed, statusTimestamp is updated and finalReferenceValue is unchanged
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // Confirmed
                    expect(poolParamsAfter.statusTimestamp).to.eq(await getLastTimestamp()) // equal to block timestamp
                    expect(poolParamsAfter.finalReferenceValue).to.eq(poolParamsBefore.finalReferenceValue) // unchanged

                })

                it('Allocates fees to the DIVA treasury and the data provider', async () => {
                    // ---------
                    // Arrange: Confirm that DIVA treasury and data provider fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                    
                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Confirm that the redemption and settlement fees have been allocated to the DIVA treasury and data provider, respectively
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);

                })

                it('Sets the redemption amounts for long and short token', async () => { 
                    // ---------
                    // Arrange: Check that both `redemptionAmountLongToken` and `redemptionAmountShortToken` are zero (initial state when pool is created)
                    // ---------
                    expect (poolParamsBefore.redemptionAmountLongToken).to.be.eq(0)
                    expect (poolParamsBefore.redemptionAmountShortToken).to.be.eq(0)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    collateralBalanceAfterFees = poolParamsBefore.collateralBalance.sub(settlementFee).sub(redemptionFee)

                    // ---------
                    // Act: User redeems all their short position tokens
                    // --------- 
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)

                    // ---------
                    // Assert: Confirm that the redemption amount per long and short token (net of fees) is set correctly
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    payoffsPerToken = calcPayoffPerToken(
                        poolParamsBefore.floor,
                        poolParamsBefore.inflection,
                        poolParamsBefore.cap,
                        poolParamsAfter.collateralBalanceLongInitial,
                        poolParamsAfter.collateralBalanceShortInitial,
                        collateralBalanceAfterFees,
                        finalReferenceValue,
                        poolParamsBefore.supplyInitial,    // works as no liquidity added or removed since creation
                        decimals
                    )
                    
                    expect(poolParamsAfter.redemptionAmountLongToken).to.eq(payoffsPerToken.payoffPerLongToken)
                    expect(poolParamsAfter.redemptionAmountShortToken).to.eq(payoffsPerToken.payoffPerShortToken)

                })

                it('Does not allocate fees twice', async () => { 
                    // ---------
                    // Arrange: Confirm the final reference value by calling the `redeemPositionToken` function the first time and get the allocated fee claims
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                    
                    // Redeem position token
                    tokensToRedeem = shortTokenBalanceBefore.div(3)
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)
                    // Get fees
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)

                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);

                    // ---------
                    // Act: Second redemption
                    // ---------
                    await settlementFacet.connect(user1).redeemPositionToken(longTokenInstance.address, tokensToRedeem)

                    // ---------
                    // Assert: Check that fee claims are unchanged
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);

                })

                // -------------------------------------------
                // Events 
                // -------------------------------------------
            
                it('Emits a StatusChanged event', async () => {               
                    // ---------
                    // Act: First redeem of position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
                    
                    // ---------
                    // Assert: Check that it emits a StatusChanged event
                    // ---------
                    const event = await statusChangedEvent(settlementFacet)
                    expect(event.statusFinalReferenceValue).to.eq(3) // 3 = Confirmed
                    expect(event.by).to.eq(user1.address)
                    expect(event.poolId).to.eq(poolId)
                    expect(event.proposedFinalReferenceValue).to.eq(poolParamsBefore.finalReferenceValue)
                })

            })

            describe('redeemPositionToken where final value was submitted, challenged but data provider didn`t respond', async () => { 
                beforeEach(async () => {      
                    // ---------
                    // Arrange: Data provider submits and it doesn't get challenged. 
                    // Given that the value has not been confiremd yet, fees were not allocated yet.
                    // ---------
                    finalReferenceValue = parseEther("1700")
                    allowChallenge = 1
                    await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge) 
                    await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)

                    poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                    reviewPeriodEndTime = (poolParamsBefore.statusTimestamp).add(reviewPeriod)
                    await setNextTimestamp(ethers.provider, (reviewPeriodEndTime.add(1)).toNumber()) // fast forward time to the end of the review period
                    // Note that fees have been subtracted
                    expect(poolParamsBefore.statusFinalReferenceValue).to.eq(2)
                    shortTokenBalanceBefore = await shortTokenInstance.balanceOf(user1.address)
                    longTokenBalanceBefore = await longTokenInstance.balanceOf(user1.address)

                })

                it('Confirms final reference value on first redeem after review period expired without another submission', async () => {
                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Check that status of final reference value is confirmed, statusTimestamp is updated and finalReferenceValue is unchanged
                    // ---------
                    poolParamsAfter = await getterFacet.getPoolParameters(poolId)
                    expect(poolParamsAfter.statusFinalReferenceValue).to.eq(3) // Confirmed
                    expect(poolParamsAfter.statusTimestamp).to.eq(await getLastTimestamp()) // equal to block timestamp
                    expect(poolParamsAfter.finalReferenceValue).to.eq(poolParamsBefore.finalReferenceValue) // unchanged
                })

                it('Allocates fees to the DIVA treasury and the data provider', async () => {
                    // ---------
                    // Arrange: Confirm that DIVA treasury and data provider fee claim is zero
                    // ---------
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(0);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(0);
                    
                    // ---------
                    // Act: User redeems all their short position tokens
                    // ---------
                    tokensToRedeem = shortTokenBalanceBefore
                    await settlementFacet.connect(user1).redeemPositionToken(shortTokenInstance.address, tokensToRedeem)
            
                    // ---------
                    // Assert: Confirm that the redemption and settlement fees have been allocated to the DIVA treasury and data provider, respectively
                    // --------- 
                    redemptionFee = calcFee(poolParamsBefore.redemptionFee, poolParamsBefore.collateralBalance, decimals)
                    settlementFee = calcFee(poolParamsBefore.settlementFee, poolParamsBefore.collateralBalance, decimals)
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, treasury.address)).to.eq(redemptionFee);
                    expect(await getterFacet.getClaims(poolParamsBefore.collateralToken, oracle.address)).to.eq(settlementFee);

                })
            })
            
            // -------------------------------------------
            // Reverts
            // -------------------------------------------

            it('Reverts if position token is zero address', async () => {                
                // ---------
                // Act & Assert: Confirm that position token redemption reverts
                // ---------
                await expect(settlementFacet.connect(user1).redeemPositionToken(ethers.constants.AddressZero, 1)).to.be.reverted
            })

            it('Reverts if status is Open', async () => {                
                // ---------
                // Arrange: Confirm that status is Open
                // ---------
                expect(await poolParams.statusFinalReferenceValue).to.be.eq(0) // Open
                
                // ---------
                // Act & Assert: Confirm that position token redemption reverts
                // ---------
                await expect(settlementFacet.connect(user1).redeemPositionToken(poolParams.shortToken, 1)).to.be.revertedWith("DIVA: final reference value not set yet")
            })

            it('Reverts if an fake position token with a valid poolId is provided', async () => {
                // ---------
                // Arrange: A user creates a fake position token with a valid poolId and data provider confirms the final reference value
                // which allows position token holders to redeem their position tokens
                // ---------
                // Create position token with an existing poolId 
                fakePositionTokenInstance = await fakePositionTokenDeployFixture("L1", "L1", poolId, user1.address);  
                initialFakePositionTokenBalance = "10000"
                await fakePositionTokenInstance.connect(user1).mint(user1.address, initialFakePositionTokenBalance)
                expect(await fakePositionTokenInstance.balanceOf(user1.address)).to.eq(initialFakePositionTokenBalance)
                
                // Data provider confirms final reference value
                finalReferenceValue = parseEther("1700")
                allowChallenge = 0
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

                // ---------
                // Act & Assert: User tries to redeem fake position tokens
                // ---------
                await expect(settlementFacet.connect(user1).redeemPositionToken(fakePositionTokenInstance.address, 1)).to.be.revertedWith("DIVA: invalid position token address")
            })

            it('Reverts if triggered before challenge period end', async () => {
                // ---------
                // Arrange: Data provider submits a value and enables the possibility to challenge
                // ---------
                finalReferenceValue = parseEther("1700")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(1) // Submitted

                challengePeriodEndTime = (poolParamsBefore.statusTimestamp).add(challengePeriod)
                await setNextTimestamp(ethers.provider, challengePeriodEndTime.toNumber()) // set timestamp of next block to the last possible moment to challenge

                // ---------
                // Act & Assert: Confirm that redeeming position tokens fails
                // ---------
                await expect(settlementFacet.connect(user1).redeemPositionToken(poolParamsBefore.shortToken, 1)).to.be.revertedWith("DIVA: challenge period not yet expired")
            })

            it('Reverts if triggered before review period end', async () => {
                // ---------
                // Arrange: Data provider submits a value and enables the possibility to challenge
                // ---------
                // Data provider submits a value
                finalReferenceValue = parseEther("1700")
                allowChallenge = 1
                await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)
                // Position token holder (user1) challenges the submitted value
                await settlementFacet.connect(user1).challengeFinalReferenceValue(poolId, finalReferenceValue)
                poolParamsBefore = await getterFacet.getPoolParameters(poolId)
                expect(poolParamsBefore.statusFinalReferenceValue).to.eq(2) // Challenged
                
                reviewPeriodEndTime = (poolParamsBefore.statusTimestamp).add(reviewPeriod)
                await setNextTimestamp(ethers.provider, reviewPeriodEndTime.toNumber()) // set timestamp of next block to the last possible moment to submit another value
                
                // ---------
                // Act & Assert: Confirm that redeeming position tokens fails
                // ---------
                await expect(settlementFacet.connect(user1).redeemPositionToken(poolParamsBefore.shortToken, 1)).to.be.revertedWith("DIVA: review period not yet expired")
            })

        })

    });

  })
  