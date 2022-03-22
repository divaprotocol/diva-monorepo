import Page from './page'
import Header from './header'
import Onboard from './onboard'

export default class HomePage extends Page {
  constructor() {
    super()
    this.header = new Header()
    this.onboard = new Onboard()
  }
  connectBrowserWallet() {
    const connectWalletButton = this.header.getConnectWalletBtn()
    connectWalletButton.click()
  }

  waitUntilLoggedIn() {
    cy.waitUntil(() => {
      const walletButton = this.header.getWalletButton()
      return walletButton.should('exist')
    })
    // waiting for wallet button is not enough in rare cases to be logged in
    // eslint-disable-next-line cypress/no-unnecessary-waiting,ui-testing/no-hard-wait
    cy.wait(2000)
  }

  getLoggedInWalletAddress() {
    const walletButton = this.header.getWalletButton()
    return walletButton.invoke('text')
  }
}
