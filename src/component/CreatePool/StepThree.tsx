import { Button } from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'
import { BigNumber, ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

import ERC20 from '../../contracts/abis/ERC20.json'
import { useDivaContract } from '../../hooks/useDivaContract'

const getExpiryInSeconds = (offsetInSeconds: number) =>
  BigNumber.from(Math.floor(Date.now() / 1000 + offsetInSeconds))

export function StepThree({
  next,
  previous,
}: {
  next: () => void
  previous: () => void
}) {
  const contract = useDivaContract()
  // const erc20Contract = await ethers.getContractAt(ERC20_ABI, erc20CollateralTokenAddress)
  // INPUT (createContingentPool arguments)
  const inflection = parseEther('100')
  const cap = parseEther('170')
  const floor = parseEther('35')
  const collateralBalanceShort = parseEther('0.1')
  const collateralBalanceLong = parseEther('0.1')
  const expiryDate = getExpiryInSeconds(200) // epoch unix timestamp in seconds
  const shortTokenSupply = parseEther('30')
  const longTokenSupply = parseEther('30')
  const referenceAsset = 'Tesla/USD'
  const collateralToken = '0xaD6D458402F60fD3Bd25163575031ACDce07538D'
  const dataFeedProvider = '0x7543C7cfA57BA2a465BAe9084F6776AEdF5684a1'

  const provider = new ethers.providers.Web3Provider(window.ethereum, 3)

  const erc20 = new ethers.Contract(
    collateralToken,
    ERC20,
    provider.getSigner()
  )

  console.log(expiryDate)

  return (
    <Container maxWidth="xs">
      <div>Placeholder</div>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button
          onClick={() => {
            const run = async () => {
              console.log('hello', contract)
              const poolCreator = await provider.getSigner()
              const creatorAddress = await poolCreator.getAddress()

              // Set allowance for DIVA contract
              erc20
                .approve(
                  '0x849b3B2eb813d6d5C70214326B412c6f67feaC03',
                  collateralBalanceLong.add(collateralBalanceShort)
                )
                .then(() => {
                  console.log('approved')
                  return erc20.allowance(
                    creatorAddress,
                    '0x849b3B2eb813d6d5C70214326B412c6f67feaC03'
                  )
                })
                .then(() => {
                  console.log('allowed')
                  contract
                    ?.createContingentPool([
                      inflection,
                      cap,
                      floor,
                      collateralBalanceShort,
                      collateralBalanceLong,
                      expiryDate,
                      shortTokenSupply,
                      longTokenSupply,
                      referenceAsset,
                      collateralToken,
                      dataFeedProvider,
                    ])
                    .then((val) => {
                      console.log('created continent pool')
                      console.log(val)
                    })
                    .catch((err) => {
                      console.error(err.message)
                    })
                })
            }
            run()
          }}
        >
          Submit input
        </Button>
      </Box>
    </Container>
  )
}
