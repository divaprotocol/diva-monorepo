// Collection of DIVA contracts and collateral token addresses on different networks (as of 30 Nov 2021)
// Make sure you have the respective amount of collateral tokens in the wallet that is creating the contingent pool (poolCreator.address)
const addresses = {
    rinkeby: {
      divaAddress: "0xa1fa77354D7810A6355583b566E5adB29C3f7733",
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0x8ca8dE48c4507fa54a83Dde7ac68097e87520eEc", // REPLACE 
      WAGMI18: "0x867e53feDe91d27101E062BF7002143EbaEA3e30", // REPLACE 
      WAGMI20: "0x384A78A65189c696a009681b20880cd9aF01Bc16" // REPLACE 
    },
    ropsten: {
      divaAddress: "0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf", 
      DAI: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0x8ca8dE48c4507fa54a83Dde7ac68097e87520eEc",
      WAGMI18: "0x867e53feDe91d27101E062BF7002143EbaEA3e30",
      WAGMI20: "0x384A78A65189c696a009681b20880cd9aF01Bc16"
    },
    polygon: {
      divaAddress: "0x27FaBaed614059b98e7f1e79D872e13aa65640a8", 
      USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
    },
    kovan: {
      divaAddress: "0x607228ebB95aa097648Fa8b24dF8807684BBF101",
      DAI: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"
    },
    polygon_mumbai: {
      divaAddress: "0xf2Ea8e23E1EaA2e5D280cE6b397934Ba7f30EF6B", 
      TestERC20Plasma: "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1"
    }
  }

// Status mapping
const status = {
  0: "Open",
  1: "Submitted",
  2: "Challenged",
  3: "Confirmed"
}

exports.addresses = addresses;
exports.status = status;