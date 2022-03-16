const { 
  redemptionFeeSetEvent, 
  settlementFeeSetEvent,
  submissionPeriodSetEvent,
  challengePeriodSetEvent,
  reviewPeriodSetEvent,
  fallbackSubmissionPeriodSetEvent,
  treasuryAddressSetEvent,
  fallbackDataProviderSetEvent,
  ownershipTransferredEvent,
  pauseReceiveCollateralSetEvent,
  pauseReturnCollateralSetEvent } = require('./events')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deployDiamond } = require('../scripts/deploy.js')
const { erc20DeployFixture } = require("./fixtures/MockERC20Fixture")
const { parseEther, parseUnits } = require('@ethersproject/units')
const { getExpiryInSeconds, ONE_DAY, getLastTimestamp, setNextTimestamp } = require('./utils.js')

// -------
// Input: Collateral token decimals (>= 3 && <= 18)
// -------
const decimals = 6

describe('GovernanceFacet', async function () {
  
  let diamondAddress
  let poolFacet, getterFacet, settlementFacet, governanceFacet
  let contractOwner, treasury, oracle, user1, user2
  let collateralTokenInstance
  let redemptionFeeDefault, settlementFeeDefault

  before(async function () {
    [contractOwner, treasury, oracle, fallbackOracle, user1, user2, ...accounts] = await ethers.getSigners(); // keep contractOwner and treasury at first two positions in line with deploy script
    
    // ---------
    // Setup: Deploy diamond contract (incl. facets) and connect to the diamond contract via facet specific ABI's
    // ---------
    diamondAddress = await deployDiamond();
    poolFacet = await ethers.getContractAt('PoolFacet', diamondAddress)
    settlementFacet = await ethers.getContractAt('SettlementFacet', diamondAddress)
    getterFacet = await ethers.getContractAt('GetterFacet', diamondAddress)
    governanceFacet = await ethers.getContractAt('GovernanceFacet', diamondAddress)
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)

    govParams = await getterFacet.getGovernanceParameters()
    redemptionFeeDefault = govParams.redemptionFee // 0.25%
    settlementFeeDefault = govParams.settlementFee // 0.05%
    submissionPeriodDefault = govParams.submissionPeriod // 1d
    challengePeriodDefault = govParams.challengePeriod // 1d
    reviewPeriodDefault = govParams.reviewPeriod // 2d
    fallbackSubmissionPeriodDefault = govParams.fallbackSubmissionPeriod // 5d
  });

  beforeEach(async () => {  
    // ---------
    // Arrange: Create a contingent pool
    // ---------
    user1StartCollateralTokenBalance = 100000;

    // Mint ERC20 collateral token with `decimals` decimals and send it to user 1
    collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", parseUnits(user1StartCollateralTokenBalance.toString(), decimals), user1.address, decimals);     
    
    // Set user1 allowances for Diamond contract
    await collateralTokenInstance.connect(user1).approve(diamondAddress, parseUnits(user1StartCollateralTokenBalance.toString(), decimals));
  });


  afterEach(async () => {
    // Reset to default values
    await governanceFacet.connect(contractOwner).setRedemptionFee(redemptionFeeDefault)
    await governanceFacet.connect(contractOwner).setSettlementFee(settlementFeeDefault)
    await governanceFacet.connect(contractOwner).setSubmissionPeriod(submissionPeriodDefault)
    await governanceFacet.connect(contractOwner).setChallengePeriod(challengePeriodDefault)
    await governanceFacet.connect(contractOwner).setReviewPeriod(reviewPeriodDefault)
    await governanceFacet.connect(contractOwner).setFallbackSubmissionPeriod(fallbackSubmissionPeriodDefault)

  })


  // Function to create contingent pools pre-populated with default values that can be overwritten depending on the test case 
  async function createContingentPool({ 
  referenceAsset = "BTC/USD",
  expiryTime = getExpiryInSeconds(7200), // Expiry in 2h
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

  describe('setRedemptionFee', async () => {
      
        // -------------------------------------------
        // Functionality
        // -------------------------------------------

        it('Allows the contract owner to set the redemption fee', async () => {
            // ---------
            // Arrange: Define the new redemption fee and confirm that it's not equal to the current one
            // ---------
            newRedemptionFee = parseEther("0.01") // 1%
            govParamsBefore = await getterFacet.getGovernanceParameters()
            expect(govParamsBefore.redemptionFee).to.not.eq(newRedemptionFee)

            // ---------
            // Act: Contract owner sets redemption fee
            // ---------
            await governanceFacet.connect(contractOwner).setRedemptionFee(newRedemptionFee)

            // ---------
            // Assert: Confirm that the new redemption fee was set in the governance parameters
            // ---------
            govParamsAfter = await getterFacet.getGovernanceParameters()
            expect(govParamsAfter.redemptionFee).to.eq(newRedemptionFee)

        })

        it('Should apply the new redemption fee for a new contingent pool created', async () => {
          // ---------
          // Arrange: Define a new redemption fee and confirm that it's not equal to the current one
          // ---------
          // Create contingent pool
          await createContingentPool()
          poolId1 = await getterFacet.getLatestPoolId()
          poolParamsBefore = await getterFacet.getPoolParameters(poolId1)
          // Define new redemption fee and confirm that it's not equal to the one in the latest contingent pool created
          newRedemptionFee = parseEther("0.01") // 1%
          expect(poolParamsBefore.redemptionFee).to.not.eq(newRedemptionFee)

          // ---------
          // Act: Contract owner sets redemption fee
          // ---------
          await governanceFacet.connect(contractOwner).setRedemptionFee(newRedemptionFee)

          // ---------
          // Assert: Confirm that the the redemption fee in the parameters of the new pool correspond to the new value 
          // ---------
          await createContingentPool()
          poolId2 = await getterFacet.getLatestPoolId()
          poolParamsAfter = await getterFacet.getPoolParameters(poolId2)
          expect(poolParamsAfter.redemptionFee).to.eq(newRedemptionFee)

        })

        // -------------------------------------------
        // Reverts
        // -------------------------------------------

        it('Reverts if triggered by an account other than the contract owner', async () => {
          // ---------
          // Arrange: Define new redemption fee
          // ---------
          newRedemptionFee = parseEther("0.01") // 1%

          // ---------
          // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
          // ---------
          await expect(governanceFacet.connect(user2).setRedemptionFee(newRedemptionFee)).to.be.revertedWith("LibDiamond: Must be contract owner")

        })

        it('Reverts if redemptionFee exceeds 2.5%', async () => {
          // ---------
          // Arrange: Define new redemption fee
          // ---------
          newRedemptionFee = parseEther("0.0251") // 2.51%

          // ---------
          // Act & Assert: Confirm that function call reverts if new fee value exceeds the maximum allowed value of 2.5%
          // ---------
          await expect(governanceFacet.connect(contractOwner).setRedemptionFee(newRedemptionFee)).to.be.revertedWith("DIVA: exceeds max allowed")

        })
        

        // -------------------------------------------
        // Events
        // -------------------------------------------

        it('Emits a RedemptionFeeSet event', async () => {
            // ---------
            // Act: Set new redemption fee
            // ---------
            newRedemptionFee = parseEther("0.01") // 1%
            await governanceFacet.connect(contractOwner).setRedemptionFee(newRedemptionFee)
            
            // ---------
            // Assert: Check that it emits a RedemptionFeeSet event
            // ---------
            const event = await redemptionFeeSetEvent(governanceFacet)
            expect(event.from).to.eq(contractOwner.address)
            expect(event.fee).to.eq(newRedemptionFee)
        })

    })

    describe('setSettlementFee', async () => {
      
        // -------------------------------------------
        // Functionality
        // -------------------------------------------

        it('Allows the contract owner to set the settlement fee', async () => {
          // ---------
          // Arrange: Define the new settlement fee and confirm that it's not equal to the current one
          // ---------
          newSettlementFee = parseEther("0.001") // 0.1%
          govParamsBefore = await getterFacet.getGovernanceParameters()
          expect(govParamsBefore.settlementFee).to.not.eq(newSettlementFee)

          // ---------
          // Act: Contract owner sets settlement fee
          // ---------
          await governanceFacet.connect(contractOwner).setSettlementFee(newSettlementFee)

          // ---------
          // Assert: Confirm that the new settlement fee was set in the governance parameters
          // ---------
          govParamsAfter = await getterFacet.getGovernanceParameters()
          expect(govParamsAfter.settlementFee).to.eq(newSettlementFee)

      })

      it('Should apply the new settlement fee for new contingent pool created', async () => {
        // ---------
        // Arrange: Define a new settlement fee and confirm that it's not equal to the current one
        // ---------
        // Create contingent pool
        await createContingentPool()
        poolId1 = await getterFacet.getLatestPoolId()
        poolParamsBefore = await getterFacet.getPoolParameters(poolId1)
        // Define new settlement fee and confirm that it's not equal to the one in the latest contingent pool created
        newSettlementFee = parseEther("0.001") // 0.1%
        expect(poolParamsBefore.redemptionFee).to.not.eq(newSettlementFee)

        // ---------
        // Act: Contract owner sets settlement fee
        // ---------
        await governanceFacet.connect(contractOwner).setSettlementFee(newSettlementFee)

        // ---------
        // Assert: Confirm that the the settlement fee in the parameters of the new pool correspond to the new value
        // ---------
        await createContingentPool()
        poolId2 = await getterFacet.getLatestPoolId()
        poolParamsAfter = await getterFacet.getPoolParameters(poolId2)
        expect(poolParamsAfter.settlementFee).to.eq(newSettlementFee)

    })

      // -------------------------------------------
      // Reverts
      // -------------------------------------------

      it('Reverts if triggered by an account other than the contract owner', async () => {
          // ---------
          // Arrange: Define new settlement fee
          // ---------
          newSettlementFee = parseEther("0.001") // 1%

          // ---------
          // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
          // ---------
          await expect(governanceFacet.connect(user2).setSettlementFee(newSettlementFee)).to.be.revertedWith("LibDiamond: Must be contract owner")

      })

      it('Reverts if settlementFee exceeds 2.5%', async () => {
          // ---------
          // Arrange: Define new settlement fee
          // ---------
          newSettlementFee = parseEther("0.0251") // 2.51%

          // ---------
          // Act & Assert: Confirm that function call reverts if new fee value exceeds the maximum allowed value of 2.5%
          // ---------
          await expect(governanceFacet.connect(contractOwner).setSettlementFee(newSettlementFee)).to.be.revertedWith("DIVA: exceeds max allowed")

      })
      

      // -------------------------------------------
      // Events
      // -------------------------------------------

      it('Emits a SettlementFeeSet event', async () => {
          // ---------
          // Act: Set new settlement fee
          // ---------
          newSettlementFee = parseEther("0.001") // 0.1%
          await governanceFacet.connect(contractOwner).setSettlementFee(newSettlementFee)
          
          // ---------
          // Assert: Check that it emits a SettlementFeeSet event
          // ---------
          const event = await settlementFeeSetEvent(governanceFacet)
          expect(event.from).to.eq(contractOwner.address)
          expect(event.fee).to.eq(newSettlementFee)
      })
    })


    describe('setSubmissionPeriod', async () => {

        // -------------------------------------------
        // Functionality
        // -------------------------------------------

        it('Allows the contract owner to set the submission period', async () => {
          // ---------
          // Arrange: Define the new submission period and confirm that it's not equal to the current one
          // ---------
          newSubmissionPeriod = 3 * ONE_DAY
          govParamsBefore = await getterFacet.getGovernanceParameters()
          expect(govParamsBefore.submissionPeriod).to.not.eq(newSubmissionPeriod)

          // ---------
          // Act: Contract owner sets the new submission period
          // ---------
          await governanceFacet.connect(contractOwner).setSubmissionPeriod(newSubmissionPeriod)

          // ---------
          // Assert: Confirm that the new submission period was set in the governance parameters
          // ---------
          govParamsAfter = await getterFacet.getGovernanceParameters()
          expect(govParamsAfter.submissionPeriod).to.eq(newSubmissionPeriod)

        })

        // -------------------------------------------
        // Reverts
        // -------------------------------------------

        it('Reverts if triggered by an account other than the contract owner', async () => {
          // ---------
          // Arrange: Define new submission period
          // ---------
          newSubmissionPeriod = 3 * ONE_DAY

          // ---------
          // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
          // ---------
          await expect(governanceFacet.connect(user2).setSubmissionPeriod(newSubmissionPeriod)).to.be.revertedWith("LibDiamond: Must be contract owner")

        })

        it('Reverts if submission period is less than 1 day', async () => {
          // ---------
          // Arrange: Set new submission period to less than 1 day
          // ---------
          newSubmissionPeriod = ONE_DAY - 1

          // ---------
          // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
          // ---------
          await expect(governanceFacet.connect(contractOwner).setSubmissionPeriod(newSubmissionPeriod)).to.be.revertedWith("DIVA: out of bounds")

        })
        
        it('Reverts if submission period is more than 15 days', async () => {
          // ---------
          // Arrange: Set new submission period to more than 15 days
          // ---------
          newSubmissionPeriod = 15 * ONE_DAY + 1

          // ---------
          // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
          // ---------
          await expect(governanceFacet.connect(contractOwner).setSubmissionPeriod(newSubmissionPeriod)).to.be.revertedWith("DIVA: out of bounds")

        })

        // -------------------------------------------
        // Events
        // -------------------------------------------

        it('Emits a SubmissionPeriodSet event', async () => {
            // ---------
            // Arrange: Define new submission period
            // ---------
            newSubmissionPeriod = 3 * ONE_DAY

            // ---------
            // Act: Contract owner sets the new submission period
            // ---------
            await governanceFacet.connect(contractOwner).setSubmissionPeriod(newSubmissionPeriod)
            
            // ---------
            // Assert: Check that it emits a SubmissionPeriodSet event
            // ---------
            const event = await submissionPeriodSetEvent(governanceFacet)
            expect(event.from).to.eq(contractOwner.address) 
            expect(event.period).to.eq(newSubmissionPeriod)
        })
    })

    describe('setChallengePeriod', async () => {

      // -------------------------------------------
      // Functionality
      // -------------------------------------------

      it('Allows the contract owner to set the challenge period', async () => {
        // ---------
        // Arrange: Define the new challenge period and confirm that it's not equal to the current one
        // ---------
        newChallengePeriod = 3 * ONE_DAY
        govParamsBefore = await getterFacet.getGovernanceParameters()
        expect(govParamsBefore.challengePeriod).to.not.eq(newChallengePeriod)

        // ---------
        // Act: Contract owner sets the new challenge period
        // ---------
        await governanceFacet.connect(contractOwner).setChallengePeriod(newChallengePeriod)

        // ---------
        // Assert: Confirm that the new challenge period was set in the governance parameters
        // ---------
        govParamsAfter = await getterFacet.getGovernanceParameters()
        expect(govParamsAfter.challengePeriod).to.eq(newChallengePeriod)

    })

      // -------------------------------------------
      // Reverts
      // -------------------------------------------

      it('Reverts if triggered by an account other than the contract owner', async () => {
        // ---------
        // Arrange: Define new challenge period
        // ---------
        newChallengePeriod = 3 * ONE_DAY

        // ---------
        // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
        // ---------
        await expect(governanceFacet.connect(user2).setChallengePeriod(newChallengePeriod)).to.be.revertedWith("LibDiamond: Must be contract owner")

      })

      it('Reverts if challenge period is less than 1 day', async () => {
        // ---------
        // Arrange: Set new challenge period to less than 1 day
        // ---------
        newChallengePeriod = ONE_DAY - 1

        // ---------
        // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
        // ---------
        await expect(governanceFacet.connect(contractOwner).setChallengePeriod(newChallengePeriod)).to.be.revertedWith("DIVA: out of bounds")

      })

      it('Reverts if challenge period is more than 15 days', async () => {
        // ---------
        // Arrange: Set new challenge period to more than 15 days
        // ---------
        newChallengePeriod = 15 * ONE_DAY + 1

        // ---------
        // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
        // ---------
        await expect(governanceFacet.connect(contractOwner).setChallengePeriod(newChallengePeriod)).to.be.revertedWith("DIVA: out of bounds")

      })

      // -------------------------------------------
      // Events
      // -------------------------------------------

      it('Emits a ChallengePeriodSet event', async () => {
        // ---------
        // Arrange: Define new challenge period
        // ---------
        newChallengePeriod = 3 * ONE_DAY

        // ---------
        // Act: Contract owner sets the new challenge period
        // ---------
        await governanceFacet.connect(contractOwner).setChallengePeriod(newChallengePeriod)
        
        // ---------
        // Assert: Check that it emits a ChallengePeriodSet event
        // ---------
        const event = await challengePeriodSetEvent(governanceFacet)
        expect(event.from).to.eq(contractOwner.address) 
        expect(event.period).to.eq(newChallengePeriod)
      })
  })

  describe('setReviewPeriod', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Allows the contract owner to set the review period', async () => {
      // ---------
      // Arrange: Define the new review period and confirm that it's not equal to the current one
      // ---------
      newReviewPeriod = 3 * ONE_DAY
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.reviewPeriod).to.not.eq(newReviewPeriod)

      // ---------
      // Act: Contract owner sets the new review period
      // ---------
      await governanceFacet.connect(contractOwner).setReviewPeriod(newReviewPeriod)

      // ---------
      // Assert: Confirm that the new review period was set in the governance parameters
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.reviewPeriod).to.eq(newReviewPeriod)

    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Arrange: Define new review period
      // ---------
      newReviewPeriod = 3 * ONE_DAY

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(user2).setReviewPeriod(newReviewPeriod)).to.be.revertedWith("LibDiamond: Must be contract owner")

    })

    it('Reverts if review period is less than 1 day', async () => {
      // ---------
      // Arrange: Set new review period to less than 1 day
      // ---------
      newReviewPeriod = ONE_DAY - 1

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(contractOwner).setReviewPeriod(newReviewPeriod)).to.be.revertedWith("DIVA: out of bounds")

    })

    it('Reverts if review period is more than 15 days', async () => {
      // ---------
      // Arrange: Set new review period to more than 15 days
      // ---------
      newReviewPeriod = 15 * ONE_DAY + 1

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(contractOwner).setReviewPeriod(newReviewPeriod)).to.be.revertedWith("DIVA: out of bounds")

    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a ReviewPeriodSet event', async () => {
      // ---------
      // Arrange: Define new review period
      // ---------
      newReviewPeriod = 3 * ONE_DAY

      // ---------
      // Act: Contract owner sets the new review period
      // ---------
      await governanceFacet.connect(contractOwner).setReviewPeriod(newReviewPeriod)
      
      // ---------
      // Assert: Check that it emits a ReviewPeriodSet event
      // ---------
      const event = await reviewPeriodSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.period).to.eq(newReviewPeriod)
    })

  })

  describe('setFallbackSubmissionPeriod', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Allows the contract owner to set the fallback period', async () => {
      // ---------
      // Arrange: Define the new fallback period and confirm that it's not equal to the current one
      // ---------
      newFallBackPeriod = 3 * ONE_DAY
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.fallbackSubmissionPeriod).to.not.eq(newFallBackPeriod)

      // ---------
      // Act: Contract owner sets the new fallback period
      // ---------
      await governanceFacet.connect(contractOwner).setFallbackSubmissionPeriod(newFallBackPeriod)

      // ---------
      // Assert: Confirm that the new fallback period was set in the governance parameters
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.fallbackSubmissionPeriod).to.eq(newFallBackPeriod)

    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Arrange: Define new fallback submission period
      // ---------
      newFallbackSubmissionPeriod = 3 * ONE_DAY

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(user2).setFallbackSubmissionPeriod(newFallbackSubmissionPeriod)).to.be.revertedWith("LibDiamond: Must be contract owner")

    })

    it('Reverts if fallback submission period is less than 1 day', async () => {
      // ---------
      // Arrange: Set new fallback submission period to less than 1 day
      // ---------
      newFallbackSubmissionPeriod = ONE_DAY - 1

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(contractOwner).setFallbackSubmissionPeriod(newFallbackSubmissionPeriod)).to.be.revertedWith("DIVA: out of bounds")

    })

    it('Reverts if fallback submission period is more than 15 days', async () => {
      // ---------
      // Arrange: Set new fallback submission period to more than 15 days
      // ---------
      newFallbackSubmissionPeriod = 15 * ONE_DAY + 1

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(contractOwner).setFallbackSubmissionPeriod(newFallbackSubmissionPeriod)).to.be.revertedWith("DIVA: out of bounds")

    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a FallbackSubmissionPeriodSet event', async () => {
      // ---------
      // Arrange: Define new fallback submission period
      // ---------
      newFallbackSubmissionPeriod = 3 * ONE_DAY

      // ---------
      // Act: Contract owner sets the new fallback submission period
      // ---------
      await governanceFacet.connect(contractOwner).setFallbackSubmissionPeriod(newFallbackSubmissionPeriod)
      
      // ---------
      // Assert: Check that it emits a FallbackSubmissionPeriodSet event
      // ---------
      const event = await fallbackSubmissionPeriodSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.period).to.eq(newFallbackSubmissionPeriod)
    })
  })

  describe('setTreasuryAddress', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Allows the contract owner to set a new treasury address', async () => {
      // ---------
      // Arrange: Define a new treasury address and confirm that it's not equal to the current one
      // ---------
      newTreasuryAddress = user2.address
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.treasury).to.not.eq(newTreasuryAddress)

      // ---------
      // Act: Contract owner sets a new treasury address
      // ---------
      await governanceFacet.connect(contractOwner).setTreasuryAddress(newTreasuryAddress)

      // ---------
      // Assert: Confirm that the new treasury address was set in the governance parameters
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.treasury).to.eq(newTreasuryAddress)

    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Arrange: Define new treasury address
      // ---------
      newTreasuryAddress = user2.address

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(user2).setTreasuryAddress(newTreasuryAddress)).to.be.revertedWith("LibDiamond: Must be contract owner")

    })

    it('Reverts if new treasury address is zero address', async () => {
      // ---------
      // Arrange: Set new treasury address to zero address
      // ---------
      newTreasuryAddress = ethers.constants.AddressZero

      // ---------
      // Act & Assert: Confirm that function call reverts
      // ---------
      await expect(governanceFacet.connect(contractOwner).setTreasuryAddress(newTreasuryAddress)).to.be.revertedWith("DIVA: zero address")

    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a TreasuryAddressSet event', async () => {
      // ---------
      // Arrange: Define new treasury address
      // ---------
      newTreasuryAddress = user2.address

      // ---------
      // Act: Contract owner sets new treasury address
      // ---------
      await governanceFacet.connect(contractOwner).setTreasuryAddress(newTreasuryAddress)
      
      // ---------
      // Assert: Check that it emits a TreasuryAddressSet event
      // ---------
      const event = await treasuryAddressSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.treasury).to.eq(newTreasuryAddress)
    })
  })

  describe('setFallbackDataProvider', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Allows the contract owner to set a new fallback data provider', async () => {
      // ---------
      // Arrange: Define a new fallback data provider and confirm that it's not equal to the current one
      // ---------
      newFallbackDataProvider = user2.address
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.fallbackDataProvider).to.not.eq(newFallbackDataProvider)

      // ---------
      // Act: Contract owner sets a new fallback data provider address
      // ---------
      await governanceFacet.connect(contractOwner).setFallbackDataProvider(newFallbackDataProvider)

      // ---------
      // Assert: Confirm that the new fallback data provider was set in the governance parameters
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.fallbackDataProvider).to.eq(newFallbackDataProvider)

    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Arrange: Define new fallback data provider
      // ---------
      newFallbackDataProvider = user2.address

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(governanceFacet.connect(user2).setFallbackDataProvider(newFallbackDataProvider)).to.be.revertedWith("LibDiamond: Must be contract owner")

    })

    it('Reverts if fallback data provider is zero address', async () => {
      // ---------
      // Arrange: Set new fallback data provider to zero address
      // ---------
      newFallbackDataProvider = ethers.constants.AddressZero

      // ---------
      // Act & Assert: Confirm that function call reverts
      // ---------
      await expect(governanceFacet.connect(contractOwner).setFallbackDataProvider(newFallbackDataProvider)).to.be.revertedWith("DIVA: zero address")

    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a FallbackDataProviderSet event', async () => {
      // ---------
      // Arrange: Define new fallback data provider
      // ---------
      newFallbackDataProvider = user2.address

      // ---------
      // Act: Contract owner sets new fallback data provider
      // ---------
      await governanceFacet.connect(contractOwner).setFallbackDataProvider(newFallbackDataProvider)
      
      // ---------
      // Assert: Check that it emits a FallbackDataProviderSet event
      // ---------
      const event = await fallbackDataProviderSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.fallbackDataProvider).to.eq(newFallbackDataProvider)
    })
  })

  describe('transferOwnership in OwnershipFacet', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Transfers contract ownership', async () => {
      // ---------
      // Arrange: Define new owner and confirm that current owner is not new owner
      // ---------
      newOwner = user2.address
      expect(await ownershipFacet.owner()).to.not.eq(newOwner)

      // ---------
      // Act: Contract owner sets new owner
      // ---------
      await ownershipFacet.connect(contractOwner).transferOwnership(newOwner)
      
      // ---------
      // Assert: Check that the new owner is set
      // ---------
      expect(await ownershipFacet.owner()).to.eq(newOwner) 

      // ---------
      // Reset: Transfer ownership back to original owner for successful executin of test below
      // ---------
      await ownershipFacet.connect(user2).transferOwnership(contractOwner.address)
    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Arrange: Define new owner
      // ---------
      newOwner = user2.address

      // ---------
      // Act & Assert: Confirm that function call reverts if called by an account other than the contract owner
      // ---------
      await expect(ownershipFacet.connect(user1).transferOwnership(newOwner)).to.be.revertedWith("LibDiamond: Must be contract owner")

    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a OwnershipTransferred event', async () => {
      // ---------
      // Arrange: Define new owner and confirm that current owner is not new owner
      // ---------
      newOwner = user2.address
      expect(await ownershipFacet.owner()).to.not.eq(newOwner)

      // ---------
      // Act: Contract owner sets new owner
      // ---------
      await ownershipFacet.connect(contractOwner).transferOwnership(newOwner)
      
      // ---------
      // Assert: Check that it emits an OwnershipTransferred event
      // ---------
      const event = await ownershipTransferredEvent(ownershipFacet)
      expect(event.previousOwner).to.eq(contractOwner.address) 
      expect(event.newOwner).to.eq(newOwner)

      // ---------
      // Reset: Transfer ownership back to original owner for successful executin of test below
      // ---------
      await ownershipFacet.connect(user2).transferOwnership(contractOwner.address)
    })
  })

  describe('setPauseReceiveCollateral', async () => {

    // -------------------------------------------
    // Functionality
    // -------------------------------------------

    it('Sets the pauseReceiveCollateral flag from false to true', async () => {
      // ---------
      // Arrange: Confirm that pauseReceiveCollateral is false
      // ---------
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.pauseReceiveCollateral).to.be.false

      // ---------
      // Act: Pause `createContingentPool` and `addLiquidity` functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(true)

      // ---------
      // Assert: Check that pauseReceiveCollateral was set to true
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.pauseReceiveCollateral).to.be.true
    })

    it('Sets the pauseReceiveCollateral flag from true to false', async () => {
      // ---------
      // Arrange: Pause `createContingentPool` and `addLiquidity` functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(true)
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.pauseReceiveCollateral).to.be.true

      // ---------
      // Act: Unpause `createContingentPool` and `addLiquidity` functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(false)

      // ---------
      // Assert: Check that pauseReceiveCollateral was set to false
      // ---------
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.pauseReceiveCollateral).to.be.false
    })

    // -------------------------------------------
    // Reverts
    // -------------------------------------------
    
    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Act & Assert: Check that user2 cannot pause `createContingentPool` and `addLiquidity` functions
      // ---------
      await expect(governanceFacet.connect(user2).setPauseReceiveCollateral(true)).to.be.revertedWith("LibDiamond: Must be contract owner")
    })

    // -------------------------------------------
    // Events
    // -------------------------------------------

    it('Emits a PauseReceiveCollateralSet event', async () => {
      // ---------
      // Act: Pause `createContingentPool` and `addLiquidity` functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReceiveCollateral(true)
      
      // ---------
      // Assert: Check that it emits a PauseReceiveCollateralSet event
      // ---------
      const event = await pauseReceiveCollateralSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.pause).to.eq(true)
    })
  })

  describe('setPauseReturnCollateral', async () => {

    it('Sets `pauseReturnCollateralUntil` 8 days after current block timestamp if triggered the first time', async () => {
      // ---------
      // Arrange: Confirm that `pauseReturnCollateralUntil` is zero initially
      // ---------
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.pauseReturnCollateralUntil).to.be.eq(0)

      // ---------
      // Act: Pause `redeemPositionToken` and `removeLiquidity` functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReturnCollateral(true)

      // ---------
      // Assert: Check that `pauseReturnCollateralUntil` was set to 8 days after current block timestamp
      // ---------
      blockTimestamp = await getLastTimestamp()
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.pauseReturnCollateralUntil).to.be.eq(blockTimestamp + 8 * ONE_DAY)
    })

    it('Sets `pauseReturnCollateralUntil` to current block timestamp if the pause is deactivated', async () => {
      // ---------
      // Arrange: Set the next block's timestamp shortly after the pause event triggered in the previous `it` block
      // ---------
      nextBlockTimestamp = (await getLastTimestamp()) + 1
      govParamsBefore = await getterFacet.getGovernanceParameters()
      expect(govParamsBefore.pauseReturnCollateralUntil).to.be.gt(nextBlockTimestamp)
      await setNextTimestamp(ethers.provider, nextBlockTimestamp)

      // ---------
      // Act: Unpause functions
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReturnCollateral(false)

      // ---------
      // Assert: Check that `pauseReturnCollateralUntil` was set to the current block timestamp
      // ---------
      blockTimestamp = await getLastTimestamp()
      govParamsAfter = await getterFacet.getGovernanceParameters()
      expect(govParamsAfter.pauseReturnCollateralUntil).to.be.eq(blockTimestamp)
    })

    it('Reverts if contract owner tries to pause before the 2 day waiting period expired', async () => {
      // ---------
      // Arrange: Set the next block timestamp such that it's within the 2 day window after pauseReturnCollateralUntil
      // ---------
      nextBlockTimestamp = (await getLastTimestamp()) + 1
      govParams = await getterFacet.getGovernanceParameters()
      expect(govParams.pauseReturnCollateralUntil).to.be.lt(nextBlockTimestamp + 1)
      expect(nextBlockTimestamp + 1).to.be.lt(govParams.pauseReturnCollateralUntil.add(2 * ONE_DAY))
      await setNextTimestamp(ethers.provider, nextBlockTimestamp)

      // ---------
      // Act & Assert: Confirm that the contract owner cannot pause the contract again before the 2 day window has passed
      // ---------
      await (expect(governanceFacet.connect(contractOwner).setPauseReturnCollateral(true))).to.be.revertedWith("DIVA: too early to pause again")
    })

    it('Reverts if triggered by an account other than the contract owner', async () => {
      // ---------
      // Act & Assert: Confirm that it reverts if triggered by an account other than the contract owner
      // ---------
      await (expect(governanceFacet.connect(user2).setPauseReturnCollateral(false))).to.be.revertedWith("LibDiamond: Must be contract owner")
    })

    it('Emits a PauseReturnCollateralSet event', async () => {
      // ---------
      // Act: Unpause `redeemPositionToken` and `removeLiquidity` functions (used unpause event as it can be done at any point in time without having to modify the next block's timestamp)
      // ---------
      await governanceFacet.connect(contractOwner).setPauseReturnCollateral(false)
      
      // ---------
      // Act & Assert: Check that it emits a PauseReturnCollateralSet event
      // ---------
      govParams = await getterFacet.getGovernanceParameters()
      const event = await pauseReturnCollateralSetEvent(governanceFacet)
      expect(event.from).to.eq(contractOwner.address) 
      expect(event.pausedUntil).to.eq(govParams.pauseReturnCollateralUntil)
    })
  })
})
    