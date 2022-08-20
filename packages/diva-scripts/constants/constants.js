// Collection of DIVA contracts and collateral token addresses on different networks (as of 30 Nov 2021)
// Make sure you have the respective amount of collateral tokens in the wallet that is creating the contingent pool (poolCreator.address)
const addresses = {
    rinkeby: {
      divaAddress: "0x3481C73363b52a26068b1C7006CEF98670FEE514",
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0xb39be38E1A07b9274f38dCD02461D09f5E5bd3f6", 
      WAGMI18: "0xFaefAF1d3e979E2FA88107453E32319d26708C74", 
    },
    ropsten: {
      divaAddress: "0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211", 
      DAI: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0x8ca8dE48c4507fa54a83Dde7ac68097e87520eEc",
      WAGMI18: "0x867e53feDe91d27101E062BF7002143EbaEA3e30",
      dUSD: "0x134e62bd2ee247d4186A1fdbaA9e076cb26c1355",
      balanceChecker: "0xD713aeC2156709A6AF392bb84018ACc6b44f1885"
    },
    polygon: {
      divaAddress: "0x131b154c13c7F2Ac4A0cC7798389A90B536F19f0", 
      USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      WAGMI18: "0xf9C6740DDFfDd0303ffDc79BAB56cc90fA858E9F",
      tUSD6: "0x09939Fb4302cC9379a1E94391aE706ca072BB836"
    },
    kovan: {
      divaAddress: "0x69E0577cAd908D9098F36dfbC4Ec36ad09920F4b",
      DAI: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"
    },
    polygon_mumbai: {
      divaAddress: "0x625aBcb0C7371d6691796E972089d75eD356523b", 
      TestERC20Plasma: "0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1",
      WAGMI18: "0x91F13B8da062f9a042dbD37D2e61FBfAcEB267aC"
    },
    goerli: {
      divaAddress: "0x8f138cfC5de71FCde7FdeCd87EAC6Aa6A536Bf85", 
      dUSD: "0xFA158C9B780A4213f3201Ae74Cca013712c8538d",
      WAGMI: "0x9A07D3F69411155f2790E5ed138b750C3Ecd28aD"
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