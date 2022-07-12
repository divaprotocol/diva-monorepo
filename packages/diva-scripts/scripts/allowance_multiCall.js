/**
 * Script to set the allowance for the 0x exchange contract
 * Run: `yarn hardhat run scripts/allowance_multiCall.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

 const { ethers } = require('hardhat');
 const BalanceCheckerABI = require('../../diva-app/src/abi/BalanceCheckerABI.json');
 const { parseUnits, formatUnits } = require('@ethersproject/units');

 
 async function main() {
 
    // Allowances function inputs
    // const ownerAddresses = [
    //   "0x9f992d5593185ab7ee9b6b0a88e41c7ee2b23937", 
    //   "0x41da2397b493fd5fcf8eb9f81c1ba838d9da6563"
    // ];
    const ownerAddresses = [
      '0x0383cd7875828d6b71f5e497bd0cfd3624c0ef1f',
      '0x8833107626356aa0a28bb67b137f598d51ba4f75',
      '0x361867ff6459d56ec71b35eced4984a0695db4ab',
      '0x58b77253d2470b821bb0904963fa392a076d340a',
      '0x212f189af21585ad2a2c4a11e6493b357feb992a',
      '0x000c68413deda826cd5bd4c02b857fe64b106c35',
      '0xf3ce71c8331f814cca0a100ed2f62c13e4a101bd',
      '0xf474d307b220388a073756761e5723ba264d49fa',
      '0x0000049507924ce153034be957e54d0d5cdefca4',
      '0x09c6230e43acdf4aa89ccab18c5cfd3f780459b7',
      '0x0bacdc7775fd61018a71b166fbc1d180d94fd931',
      '0x508919ebbc5e2e890388266bf40cf18456815f0a',
      '0xa17337d3d78580e81c3f789a88566e389e0b54ff',
      '0x2adf6094c969095ea1720046ff47c3b5f49fab9f',
      '0x50101cf7fc07256b3ca242062cc1c6ad97bf551f',
      '0x0b6b12c82ccc8bd27272370b695e2500f25a61d4',
      '0x0c76b7bf0da823de916606fcb5105633406fbf5d',
      '0xc8e3cae2315a91a3a5160b59b230dfb3aa9e9c43',
      '0x96be603d04778a3b70caea9075e0767e02562121',
      '0xc58cb30c5f7b0eb426d5f5d3d676ee80552144b6',
      '0x9888b9d16242fafe46bd8aa3b683e31dfa2a6a65',
      '0xc6abaeba052cdc44d2876cd648f2fc95497dfee9', //
      '0xa7a6200a2cb22edd78e573c26ac30bb797ee2cd9',
      '0x8d93c5e1e4439f91fbd21ceeddfedc1d38410424',
      '0xc2b89b0817c3e782d8d7fe7e55869e8178d51911',
      '0x0f3c3349f89f11ca4035b0cce3027e9cc5fc0d55',
      '0x4ca7d48af10e36102489f9fa59b1863d95e61461',
      '0x1d5b51e8dd1cc1c1b2cd27b8cc00dae3766196df',
      '0xb71ec161e870b5fc23251eb78fef2dc0da729a0f',
      '0xf0c386cb8d29cd987e72aaa0609d6bb815508b28',
      '0x2edbc02549adc10eb69506cdfc21af06521e5e8a',
      '0xb431481b23aff6efa40fe19094845a293ce09f0c',
      '0xaf5e80f6e40162c77a4ee293269c289f7dfb5035',
      '0x952220879b9a3ad28230994196109ac0f3a95f83',
      '0xb4162bf24d055ae6be055682515bb429a54cf991',
      '0xc318ea456098d01d4224d04ca42afb457dfee183',
      '0x107ae3e61b6ae2449b378fb8acf15b33c1c7c061',
      '0xbf7dce7ba8be96369835a37fd559418d13c63ed3',
      '0x9f992d5593185ab7ee9b6b0a88e41c7ee2b23937',
      '0x7fe92fbc8ecb9ab55dd2f78a8bc50498ce49cb53',
      '0x1c0243788f08b0ec6c0977d564fe0c64f13e0c9b',
      '0x5dfaa288d95cc65905969add8f735db72cc3a082',
      '0x955a84ce9acf003dbbd8615f16244ea722b01a7d',
      '0x6189206861f3373084d211b67d713509b1dca64f',
      '0x9adefeb576dcf52f5220709c1b267d89d5208d78',
      '0x0b016476072f7d7d5c4e03bdf84511f80e12cb5e',
      '0x8cb4dafa97569601a3b339f986e2517a61414e48',
      '0xe6fe06658988f6c817664ea433dbd9c7ffe6df6d',
      '0xcfe99e4daddcf2c3d0666e7b23ffa0766b1a4c84',
      '0xd4933c9217e76d7c7e1e88a2396030b1f5f9b3f6',
      '0x9c696277d2432405c9d2c03039116b8f9376ff94',
      '0x41da2397b493fd5fcf8eb9f81c1ba838d9da6563',
      '0x94f9199bee0abe9a74d6c9eea2b7751b789132a9',
      '0x4f39e946849705697f2f91ffccf01aad04031a20',
      '0xda5ef83177dce835621f952ed83352ac66efa433',
      '0x78cd8c87b4471b9e3a85a440b5fad157f81c8476',
      '0xad306172a362ea30246ade8e46158fc4710d4798'
    ]

    // const spenderAddresses = [
    //   "0xdef1c0ded9bec7f1a1670819833240f027b25eff",
    //   "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
    // ] // exchangeProxyAddress: 0xdef1c0ded9bec7f1a1670819833240f027b25eff   
    const spenderAddresses = Array.from({ length: ownerAddresses.length }).fill(
      "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
    )
    // const tokenAddresses = [
    //   "0x134e62bd2ee247d4186a1fdbaa9e076cb26c1355",
    //   "0x134e62bd2ee247d4186a1fdbaa9e076cb26c1355"
    // ]
    const tokenAddresses = Array.from({ length: ownerAddresses.length }).fill(
      "0x134e62bd2ee247d4186a1fdbaa9e076cb26c1355"
    )

    const balanceCheckerAddress = "0xD713aeC2156709A6AF392bb84018ACc6b44f1885"

    // Connect to token to approve
    const balanceChecker = await ethers.getContractAt(BalanceCheckerABI, balanceCheckerAddress);
    
    // Allowances returned from BalanceChecker contract
    const allowances = await balanceChecker.allowances(ownerAddresses, spenderAddresses, tokenAddresses)
    console.log("allowances: " + allowances)
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
