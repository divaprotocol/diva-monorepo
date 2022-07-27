# Order widget

Check list for testing the order widget on the trade page:

## BUY LIMIT
* Setting allowance:
   * [ ] APPROVE button is enabled if i) Number AND Price have been entered by the user and ii) the resulting You Pay amount exceeds the user's remaining allowance. 
   * [ ] APPROVE button is disabled if one of the two input fields (Number or Price) are removed/empty.
   * [ ] APPROVE button is disabled if You Pay amount is less than or equal to the user's remaining allowance.
   * [ ] You Pay amount is automatically updated on user input.
   * [ ] User can approve a You Pay amount that exceeds their wallet balance.
   * [ ] After successful approval, the inputs for Number and Price remain inside the input fields and are NOT cleared.
   * [ ] After successful approval, APPROVE button is disabled.
   * [ ] On user rejection in Metamask pop-up, APPROVE button is enabled (and stops spinning) and user inputs are NOT cleared.
   * [ ] After user rejection, the approve transaction should be repeatable without requiring a page reload.
* Placing orders:
   * [ ] CREATE button is enabled if i) both Number AND Price have been entered by the user
   and ii) the You Pay amount DOES NOT exceed the user's wallet balance. 
   * [ ] CREATE button is disabled if one of the two input fields (Number or Price) are removed/empty.
   * [ ] CREATE button is disabled if You Pay amount exceeds the user's wallet balance.
   * [ ] An "Insufficient balance" notification is shown to the user if the You Pay amount i) exceeds the user's wallet balance and ii) is within the remaining allowance. Otherwise the approve process will be triggered and no notification is needed. The notification should disappear if the user reduces/removes the input. **TODO: Notification part**
   * [ ] User can place multiple orders witin their allowance and they automatically show up in the orderbook.
   * [ ] After successful order creation, the input fields are cleared and the CREATE button is disabled.
   * [ ] After successful order creation, the remaining allowance is automatically reduced by the You Pay amount.
   * [ ] On user rejection in Metamask pop-up, CREATE button is enabled (and stops spinning) and user inputs are NOT cleared.
   * [ ] After user rejection, the creation of the order should be repeatable without requiring a page reload.
* Max Yield & Break-even:
   * [ ] Updates Break-even on Price input.
   * [ ] Break-even shows 'n/a' if price is greater than 1.

## SELL LIMIT
* Setting allowance:
   * [ ] APPROVE button is enabled if Number has been entered by the user and that amount exceeds the user's remaining allowance. Note that as opposed to BUY LIMIT, there is no need to enter the Price for the approve process.
   * [ ] APPROVE button is disabled if the Number is removed/empty.
   * [ ] APPROVE button is disabled if the Number is less than or equal to the user's remaining allowance.
   * [ ] User can approve a Number amount that exceeds their wallet balance.
   * [ ] After successful approval, the Number input remains inside the input field and is NOT cleared.
   * [ ] After successful approval, APPROVE button is disabled.
   * [ ] On user rejection in Metamask pop-up, APPROVE button is enabled (and stops spinning) and user inputs are NOT cleared.
   * [ ] After user rejection, the approve transaction should be repeatable without requiring a page reload.
* Placing orders:
   * [ ] You Receive amount is automatically updated after both Number and Price have been entered.
   * [ ] CREATE button is enabled if i) both Number AND Price have been entered by the user
   and ii) the Number amount DOES NOT exceed the user's wallet balance.
   * [ ] CREATE button is disabled if one of the two input fields (Number or Price) are removed/empty.
   * [ ] CREATE button is disabled if Number amount exceeds the user's wallet balance.
   * [ ] An "Insufficient balance" notification is shown to the user if the Number amount i) exceeds the user's wallet balance and ii) is within the remaining allowance. Otherwise the approve process will be triggered and no notification is needed. The notification should disappear if the user reduces/removes the input. **TODO: Notification part**
   * [ ] User can place multiple orders witin their allowance and they automatically show up in the orderbook.
   * [ ] After successful order creation, the input fields are cleared and the CREATE button is disabled.
   * [ ] After successful order creation, the remaining allowance is automatically reduced by the Number amount.
   * [ ] On user rejection in Metamask pop-up, CREATE button is enabled (and stops spinning) and user inputs are NOT cleared.
   * [ ] After user rejection, the creation of the order should be repeatable without requiring a page reload.
* Max Yield & Break-even:
   * [ ] Updates Break-even on Price input.
   * [ ] Break-even shows 'n/a' if price is greater than 1.

## SELL MARKET
* Setting allowance:
   * [ ] APPROVE button is enabled if i) Number has been entered and ii) Number **incl. fees** exceeds the user's remaining allowance.
   * [ ] APPROVE button is disabled if the Number field is removed/empty.
   * [ ] APPROVE button is disabled if Number **incl. fees** amount is less than or equal to the user's remaining allowance.
   * [ ] You Receive is automatically updated on user input.
   * [ ] User can approve a Number **incl. fees** that exceeds their wallet balance.
   * [ ] After successful approval, the input for Number remains inside the input field and is NOT cleared.
   * [ ] After successful approval, APPROVE button is disabled.
   * [ ] On user rejection in Metamask pop-up, APPROVE button is enabled (and stops spinning) and Number input is NOT cleared.
   * [ ] After user rejection, the approve transaction should be repeatable without requiring a page reload.
* Filling orders:
   * [ ] FILL button is enabled if i) Number has been entered by the user and ii) Number **incl. fees** DOES NOT exceed the user's wallet balance.
   * [ ] FILL button is disabled if Number field is removed/empty.
   * [ ] FILL button is disabled if Number **incl. fees** exceeds the user's wallet balance.
   * [ ] FILL button stays disabled if there are no Bids / Buy Limit orders in the orderbook, irrespective of a user's inputs. [TEST]
   * [ ] An "Insufficient balance" notification is shown to the user if the Number **incl. fees** amount i) exceeds the user's wallet balance and ii) is within the remaining allowance. Otherwise the approve process will be triggered and no notification is needed. The notification should disappear if the user reduces/removes the input. **TODO: Notification part**
   * [ ] Number incl. fees should update automatically on user input. 
   * [ ] User can partially fill an order in the orderbook and the orderbook gets updated automatically.
   * [ ] User can fill multiple order in the orderbook and the orderbook gets updated automatically.
   * [ ] Fill success message is only shown once if multiple orders are filled.
   * [ ] After successful order fill, Number, Number incl. fees and You Receive are reset and Expected Price is updated if the best order was cleared.
   * [ ] After successful order fill, Wallet Balance is automatically reduced by Number incl. fees. Make sure you are not filling orders from your own account, otherwise you may get confused.
   * [ ] If there are no Bids / Buy Limit orders in the orderbook, the FILL button should stay disabled on Number input and show a "No Bids in orderbook" notification to the user. The notification should disappear if the user removes the input. **TODO: Notification part** [TEST]
   * [ ] On user rejection in Metamask pop-up, FILL button is enabled (and stops spinning) and user input is NOT cleared.
   * [ ] After user rejection, the fill order transaction should be repeatable without requiring a page reload.
   * [ ] Should set Expected Price to zero if all Bid / Buy Limit orders in orderbook are filled at. [TEST]
* Expected price:
   * [ ] If no user input is provided, the Expected Price shows the best price available in the order book.
   * [ ] If a user input is provided, the Expected Price is calculated correctly and updated automatically.
* Max Yield & Break-even:
   * [ ] Updates Break-even on Expected Price change.
   * [ ] Break-even shows 'n/a' if price is greater than 1.

## BUY MARKET
* Setting allowance:
   * [ ] APPROVE button is enabled if i) Number has been entered and ii) You Pay (incl. fee) amount exceeds the user's remaining allowance.
   * [ ] APPROVE button is disabled if the Number field is removed/empty.
   * [ ] APPROVE button is disabled if You Pay (incl. fee) amount is less than or equal to the user's remaining allowance.
   * [ ] You Pay (incl. fee) is automatically updated on user input.
   * [ ] User can approve a You Pay (incl. fee) amount that exceeds their wallet balance.
   * [ ] After successful approval, the input for Number remains inside the input field and is NOT cleared.
   * [ ] After successful approval, APPROVE button is disabled.
   * [ ] On user rejection in Metamask pop-up, APPROVE button is enabled (and stops spinning) and Number input is NOT cleared.
   * [ ] After user rejection, the approve transaction should be repeatable without requiring a page reload.
* Filling orders:
   * [ ] FILL button is enabled if i) Number has been entered by the user and ii) You Pay (incl. fee) DOES NOT exceed the user's wallet balance.
   * [ ] FILL button is disabled if Number field is removed/empty.
   * [ ] FILL button is disabled if You Pay (incl. fee) exceeds the user's wallet balance.
   * [ ] FILL button stays disabled if there are no Asks / Sell Limit orders in the orderbook, irrespective of a user's inputs. [TEST] 
   * [ ] An "Insufficient balance" notification is shown to the user if the You Pay (incl. fee) amount i) exceeds the user's wallet balance and ii) is within the remaining allowance. Otherwise the approve process will be triggered and no notification is needed. The notification should disappear if the user reduces/removes the input. **TODO: Notification part**
   * [ ] You Pay (incl. fee) should update automatically on user input. 
   * [ ] User can partially fill an order in the orderbook and the orderbook gets updated automatically.
   * [ ] User can fill multiple order in the orderbook and the orderbook gets updated automatically.
   * [ ] Fill success message is only shown once if multiple orders are filled.
   * [ ] After successful order fill, Number and You Pay (incl. fee) are reset and Expected Price is updated if the best order was cleared.
   * [ ] After successful order fill, Wallet Balance is automatically reduced by You Pay (incl. fee). Make sure you are not filling orders from your own account, otherwise you may get confused.
  * [ ] If there are no Asks / Sell Limit orders in the orderbook, the FILL button should stay disabled on Number input and show a "No Asks in orderbook" notification to the user. The notification should disappear if the user removes the input. **Notification part is pending implementation.** [TEST]
  * [ ] On user rejection in Metamask pop-up, FILL button is enabled (and stops spinning) and user input is NOT cleared.
  * [ ] After user rejection, the fill order transaction should be repeatable without requiring a page reload.
  * [ ] Should set Expected Price to zero if all Ask / Sell Limit orders in orderbook are filled at. [TEST]
* Expected price:
   * [ ] If no user input is provided, the Expected Price shows the best price available in the order book.
   * [ ] If a user input is provided, the Expected Price is calculated correctly and updated automatically.
* Max Yield & Break-even:
   * [ ] Updates Break-even on Expected Price change.
   * [ ] Break-even shows 'n/a' if price is greater than 1.

## General
* [ ] User's are not allowed to enter characters into the input field (PENDING implementation)
* [ ] Buttons keep showing loading wheel until both the transaction and 0x data refresh have been completed.
* [ ] Small amounts are handled correctly (e.g., 1e-18)

## Tips & Comments
* Use the `approve.js` script in `packages/diva-scripts` to set the allowance. Set `tokenToApprove` to the collateral/position token address, set the `allowance` amount and run `yarn hardhat run scripts/approve.js --network ropsten` inside `packages/diva-scripts`. Make sure you have an `.env` file in order to execute transactions.
* If you create a Sell Limit order say and reduce the allowance afterwards, thereby reducing the fillable quantity, all additional approval giving afterwards will go towards making the existing order fully fillable. That is, if say you have placed a Sell Limit order with quantity = 1 and afterwards you reduce the allowance to quantity = 0.8, then, if you want to do a SELL MARKET for 0.1, for which you need additional allowance, this additional allowance will increase the fillable quantity of the existing Sell Limit order rather than enabling you to execute the SELL MARKET order of 0.1. This is expected behavior and not a bug.
* Adding liquidity requires approving the collateral token. After liquidity has been added, the allowance will drop to zero. Currently, this may impact the fillable of a user's outstanding Buy Limit orders. **TODO: Incorporate a user's outstanding Buy Limit orders when setting the allowance in Add Liquidity.** 
* Run the test cases both with a full and with an empty orderbook. For instance, it happened that APPROVE button enabling/disabling in SELL MARKET worked as expected when the orderbook was full, but didn't (APPROVE button was enabled although entered amount didn't exceed the remaining allowance) when it was empty.

# Orderbook

Check list for testing the order widget on the trade page:

* [ ] Orders disappear automatically after they expire