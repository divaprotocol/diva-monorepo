import { Button } from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
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
  // INPUT (createContingentPool arguments)
  const inflection = parseEther('100')
  const cap = parseEther('170')
  const floor = parseEther('35')
  const collateralBalanceShort = parseEther('0.1')
  const collateralBalanceLong = parseEther('0.1')
  const expiryDate = getExpiryInSeconds(200) // epoch unix timestamp in seconds
  const shortTokenSupply = parseEther('111.556')
  const longTokenSupply = parseEther('222.11245')
  const referenceAsset = 'Tesla/USD'
  const collateralToken = '0xaD6D458402F60fD3Bd25163575031ACDce07538D'
  const dataFeedProvider = '0x7543C7cfA57BA2a465BAe9084F6776AEdF5684a1'

  return (
    <Container maxWidth="xs">
      <div>Placeholder</div>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button
          onClick={() => {
            console.log('hello', contract)
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
          }}
        >
          Submit input
        </Button>
      </Box>
    </Container>
  )
}
