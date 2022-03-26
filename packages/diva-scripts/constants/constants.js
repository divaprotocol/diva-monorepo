// Collection of DIVA contracts and collateral token addresses on different networks (as of 30 Nov 2021)
// Make sure you have the respective amount of collateral tokens in the wallet that is creating the contingent pool (poolCreator.address)
const addresses = {
    rinkeby: {
      divaAddress: "0x5EB926AdbE39029be962acD8D27130073C50A0e5", // Previous: 0xdCd9174EFd1441D3851e6bccb959C7e7829C7275, New: 0x5EB926AdbE39029be962acD8D27130073C50A0e5
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0x8ca8dE48c4507fa54a83Dde7ac68097e87520eEc",
      WAGMI18: "0x867e53feDe91d27101E062BF7002143EbaEA3e30",
      WAGMI20: "0x384A78A65189c696a009681b20880cd9aF01Bc16"
    },
    ropsten: {
      divaAddress: "0x6455A2Ae3c828c4B505b9217b51161f6976bE7cf", // Previous: 0x8ddA74e2a613022D880fd9B737Ff45865bcCcEbc, New: 0x6455A2Ae3c828c4B505b9217b51161f6976bE7cf
      DAI: "0xaD6D458402F60fD3Bd25163575031ACDce07538D",
      WETH: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
      WAGMI6: "0x8ca8dE48c4507fa54a83Dde7ac68097e87520eEc",
      WAGMI18: "0x867e53feDe91d27101E062BF7002143EbaEA3e30",
      WAGMI20: "0x384A78A65189c696a009681b20880cd9aF01Bc16"
    },
    polygon: {
      divaAddress: "0xe3343218CAa73AE523D40936D64E7f335AfDe8f9", // Previous: 0xD7D5f9442f97245605D99cAeD72d27D40b94251C, New: 0xe3343218CAa73AE523D40936D64E7f335AfDe8f9
      USDC: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"
    },
    kovan: {
      divaAddress: "0xa8450f6cDbC80a07Eb593E514b9Bd5503c3812Ba", // Previous: 0x93640bd8fEa53919A102ad2EEA4c503E640eDDAd, New: 0xa8450f6cDbC80a07Eb593E514b9Bd5503c3812Ba
      DAI: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"
    },
    polygon_mumbai: {
      divaAddress: "0xCDc415B8DEA4d348ccCa42Aa178611F1dbCD2f69", // Previous: 0x774A6278e8dC91a2833a2BA0377c1c7aDDc1E2f2, New: 0xa8450f6cDbC80a07Eb593E514b9Bd5503c3812Ba
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