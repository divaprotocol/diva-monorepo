import Page from './page'

export default class MarketsPage extends Page {
  constructor() {
    super()
  }
  getTradeButton() {
    return cy.findByText('Trade')
  }
  getLiquidityButton() {
    return cy.findByText('Liquidity')
  }
  getAddLiqButton() {
    return cy.findByText('Add')
  }
  getRemLiqButton() {
    return cy.findByText('Remove')
  }
  getLiqInput() {
    return cy.get(
      '//*[@id="root"]/div/div/div/div[2]/div/div[2]/div[2]/div/div[1]/div/div/input'
    )
  }
}
