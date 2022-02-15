import Page from './page'
export default class Header extends Page {
  getConnectWalletBtn() {
    return cy.findByText('Connect Wallet')
  }
  getWalletButton() {
    return cy.contains('0x')
  }
}
