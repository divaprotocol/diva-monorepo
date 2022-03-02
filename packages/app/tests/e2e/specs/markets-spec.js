import MarketsPage from '../pages/markets-page'
import HomePage from '../pages/home-page'
const home = new HomePage()
const markets = new MarketsPage()

describe('Liquidity page tests', () => {
  before(() => {
    cy.visit('http://localhost:3000/10/long')
    home.connectBrowserWallet()
    // home.acceptMetamaskAccessRequest()
    home.waitUntilLoggedIn()
  })

  context('Opening the liquidity page', () => {
    it('should show warning for expired pools', () => {
      markets.getLiquidityButton().click()
      cy.waitUntil(() => {
        const warningLabel = cy.findByText(
          'Pool expired. Addition/removal of liquidity is no longer possible'
        )
        return warningLabel.should('exist')
      })
      // eslint-disable-next-line cypress/no-unnecessary-waiting,ui-testing/no-hard-wait
      cy.wait(2000)
    })
  })
})
