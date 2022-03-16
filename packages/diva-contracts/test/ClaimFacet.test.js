const { feesClaimedEvent, feeClaimTransferredEvent } = require('./events')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deployDiamond } = require('../scripts/deploy.js')
const { erc20DeployFixture } = require("./fixtures/MockERC20Fixture")
const { parseEther, parseUnits } = require('@ethersproject/units')
const { getLastTimestamp } = require('./utils.js')

// -------
// Input: Collateral token decimals (>= 3 && <= 18)
// -------
const decimals = 6

describe('ClaimFacet', async function () {
  
  let diamondAddress
  let poolFacet, getterFacet, settlementFacet
  let contractOwner, treasury, oracle, user1, user2
  let collateralTokenInstance

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
    ownershipFacet = await ethers.getContractAt('OwnershipFacet', diamondAddress)

  });

  describe('Claim', async () => {
      let user1StartCollateralTokenBalance;
      
      beforeEach(async () => {  
            // ---------
            // Arrange: Create an expired pool and confirm final reference value so that fees are paid to the DIVA treasury and the data provider
            // ---------
            user1StartCollateralTokenBalance = 100000;

            // Mint ERC20 collateral token with `decimals` decimals and send it to user 1
            collateralTokenInstance = await erc20DeployFixture("DummyCollateralToken", "DCT", parseUnits(user1StartCollateralTokenBalance.toString(), decimals), user1.address, decimals);     
            
            // Set user1 allowances for Diamond contract
            await collateralTokenInstance.connect(user1).approve(diamondAddress, parseUnits(user1StartCollateralTokenBalance.toString(), decimals));
        
            // Create an expired contingent pool
            referenceAsset = "BTC/USD"
            expiryTime = await getLastTimestamp()  // current block timestamp
            floor = parseEther("1198.53")
            inflection = parseEther("1605.33")
            cap = parseEther("2001.17")
            collateralBalanceShort = parseUnits("10000.54", decimals)
            collateralBalanceLong = parseUnits("5000.818", decimals)
            supplyPositionToken = parseEther("100.556")
            collateralToken = collateralTokenInstance.address 
            dataProvider = oracle.address
            capacity = 0 // Uncapped

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
            poolId = await getterFacet.getLatestPoolId()
            poolParamsBefore = await getterFacet.getPoolParameters(poolId) 
            
            // Confirm final reference value
            finalReferenceValue = parseEther("1700.89")
            allowChallenge = 0
            await settlementFacet.connect(oracle).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge)

          });

    describe('claimFees', async () => {

        // -------------------------------------------
        // Functionality
        // -------------------------------------------

        it('Reduces the claimable amount after fees are claimed by the data provider and DIVA treasury', async () => {
            // ---------
            // Arrange: Confirm that data provider's and treasury's fee claim is positive
            // ---------
            expect(await getterFacet.getClaims(collateralToken, oracle.address)).to.be.gt(0)
            expect(await getterFacet.getClaims(collateralToken, treasury.address)).to.be.gt(0)

            // ---------
            // Act: Claim fees
            // ---------
            await claimFacet.connect(oracle).claimFees(collateralToken)
            await claimFacet.connect(treasury).claimFees(collateralToken)

            // ---------
            // Assert: Fee claim goes down to zero
            // ---------
            expect(await getterFacet.getClaims(collateralToken, oracle.address)).to.eq(0)
            expect(await getterFacet.getClaims(collateralToken, treasury.address)).to.eq(0)

        })

        it('Increases the data provider`s and treasury`s collateral token balance after claiming fees', async () => {
            // ---------
            // Arrange: Confirm that data provider's and treasury's fee claims are positive and collateral token balances are zero 
            // ---------
            feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)
            feeClaimTreasury = await getterFacet.getClaims(collateralToken, treasury.address)
            expect(feeClaimDataProvider).to.be.gt(0)
            expect(feeClaimTreasury).to.be.gt(0)
            expect(await collateralTokenInstance.balanceOf(oracle.address)).to.eq(0)
            expect(await collateralTokenInstance.balanceOf(treasury.address)).to.eq(0)

            // ---------
            // Act: Claim fees
            // ---------
            await claimFacet.connect(oracle).claimFees(collateralToken)
            await claimFacet.connect(treasury).claimFees(collateralToken)

            // ---------
            // Assert: Check that data provider's collateral token balance increased
            // ---------
            expect(await collateralTokenInstance.balanceOf(oracle.address)).to.eq(feeClaimDataProvider)
            expect(await collateralTokenInstance.balanceOf(treasury.address)).to.eq(feeClaimTreasury)
        })

        // -------------------------------------------
        // Events
        // -------------------------------------------

        it('Emits a FeesClaimed event', async () => {
            // ---------
            // Arrange: Confirm that data provider's fee claim is positive 
            // ---------
            feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)
            expect(feeClaimDataProvider).to.be.gt(0)

            // ---------
            // Act: Claim fees
            // ---------
            await claimFacet.connect(oracle).claimFees(collateralToken)
            
            // ---------
            // Assert: Check that it emits a FeesClaimed event
            // ---------
            const event = await feesClaimedEvent(claimFacet)
            expect(event.by).to.eq(oracle.address)
            expect(event.collateralToken).to.eq(collateralToken)
            expect(event.amount).to.eq(feeClaimDataProvider)
        })

        })
    

    describe('transferFeeClaim', async () => { 

        // -------------------------------------------
        // Functionality
        // -------------------------------------------
        it('Reduces the sender`s and increases the recipient`s fee claim balance', async () => {
            // ---------
            // Arrange: Check that data provider's fee claim is positive and uers2's balance is zero
            // ---------
            feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)
            expect(feeClaimDataProvider).to.be.gt(0)
            expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(0)

            // ---------
            // Act: Transfer fee claim to user2 
            // ---------
            await claimFacet.connect(oracle).transferFeeClaim(user2.address, collateralToken, feeClaimDataProvider)

            // ---------
            // Assert: Check that user2's fee claim balance is positive and data provider's balance is zero 
            // ---------
            expect(await getterFacet.getClaims(collateralToken, oracle.address)).to.eq(0)
            expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(feeClaimDataProvider)
        })

        it('Allows the new recipient to claim the fees', async () => { 
            // ---------
            // Arrange: Transfer fee claim and confirm that user2's collateral token balance is zero before the claim
            // ---------
            feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)
            await claimFacet.connect(oracle).transferFeeClaim(user2.address, collateralToken, feeClaimDataProvider)
            expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(feeClaimDataProvider)
            expect(await collateralTokenInstance.balanceOf(user2.address)).to.eq(0)

            // ---------
            // Act: New fee recipient (user2) claims fee 
            // ---------
            await claimFacet.connect(user2).claimFees(collateralToken)

            // ---------
            // Assert: Check that user2's collateral token balance increased and fee claim reduced to zero 
            // ---------
            expect(await collateralTokenInstance.balanceOf(user2.address)).to.eq(feeClaimDataProvider)
            expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(0)
        })

        it('Does not change the old and new fee recipient`s balance if a zero amount is transferred', async () => { 
          // ---------
          // Arrange: Get fee claim amount before the transfer
          // ---------
          feeClaimDataProviderBefore = await getterFacet.getClaims(collateralToken, oracle.address)
          expect(feeClaimDataProviderBefore).to.be.gt(0)
          expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(0)

          // ---------
          // Act: Transfer zero fee claim amount 
          // ---------
          await claimFacet.connect(oracle).transferFeeClaim(user2.address, collateralToken, 0)

          // ---------
          // Assert: Check that the data provider's and user2's fee claim remain unchanged 
          // ---------
          expect(await getterFacet.getClaims(collateralToken, oracle.address)).to.eq(feeClaimDataProviderBefore)
          expect(await getterFacet.getClaims(collateralToken, user2.address)).to.eq(0)
      })

        // -------------------------------------------
        // Reverts
        // -------------------------------------------

        it('Reverts if amount exceeds user`s fee claim', async () => {
          // ---------
          // Arrange: Get fee claim amount
          // --------- 
          feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)

          // ---------
          // Act & Assert: Transfer amount that is larger than the claimable amount and confirm that it reverts 
          // ---------  
          await expect(claimFacet.connect(oracle).transferFeeClaim(user2.address, collateralToken, feeClaimDataProvider.add(1))).to.be.revertedWith("DIVA: amount exceeds claimable fee amount")
        })

        // -------------------------------------------
        // Events
        // -------------------------------------------

        it('Emits a FeeClaimTransferred event', async () => {
          // ---------
          // Act: Transfer fee claim
          // ---------  
          feeClaimDataProvider = await getterFacet.getClaims(collateralToken, oracle.address)
          await claimFacet.connect(oracle).transferFeeClaim(user2.address, collateralToken, feeClaimDataProvider)

          // ---------
          // Assert: Check that it emits a FeeClaimTransferred event
          // ---------
          const event = await feeClaimTransferredEvent(claimFacet)
          expect(event.from).to.eq(oracle.address)
          expect(event.to).to.eq(user2.address)
          expect(event.collateralToken).to.eq(collateralToken)
          expect(event.amount).to.eq(feeClaimDataProvider)
        })

    })
  })
})