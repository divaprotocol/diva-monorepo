import HomePage from '../pages/home-page'

const home = new HomePage()

let metamaskWalletAddress

describe('Wallet tests', () => {
  before(() => {
    home.getMetamaskWalletAddress().then((address) => {
      metamaskWalletAddress = address
    })
    cy.visit('http://localhost:3000/')
  })
  context('Connect metamask wallet', () => {
    // eslint-disable-next-line ui-testing/missing-assertion-in-test
    it(`should login with success`, () => {
      home.connectBrowserWallet()
      home.acceptMetamaskAccessRequest()
      home.waitUntilLoggedIn()
      home.getLoggedInWalletAddress().then((exchangeWalletAddress) => {
        const formattedMetamaskWalletAddress =
          metamaskWalletAddress.slice(0, 6) +
          '...' +
          metamaskWalletAddress.slice(-4)
        expect(exchangeWalletAddress).to.equal(formattedMetamaskWalletAddress)
      })
    })
  })
})
