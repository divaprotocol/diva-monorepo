import { Button } from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'
import { BigNumber, ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

import ERC20 from '../../contracts/abis/ERC20.json'
import { useDiva } from '../../hooks/useDiva'
import { useCreatePoolFormik } from './formik'

const getExpiryInSeconds = (offsetInSeconds: number) =>
  BigNumber.from(Math.floor(Date.now() / 1000 + offsetInSeconds))

export function ReviewAndSubmit({
  formik,
  previous,
}: {
  next: () => void
  formik: ReturnType<typeof useCreatePoolFormik>
  previous: () => void
}) {
  const { values } = formik
  const contract = useDiva()
  const {
    inflection,
    cap,
    floor,
    collateralBalanceLong,
    collateralBalanceShort,
    expiryDate,
    shortTokenSupply,
    longTokenSupply,
    referenceAsset,
    collateralTokenSymbol: collateralToken,
    dataFeedProvider,
  } = values

  return (
    <Container maxWidth="xs">
      <div>Placeholder</div>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button
          onClick={() => {
            if (collateralToken != null && dataFeedProvider != null) {
              contract
                ?.createContingentPool({
                  inflection,
                  cap,
                  floor,
                  collateralBalanceShort,
                  collateralBalanceLong,
                  expiryDate: expiryDate.getTime(),
                  supplyShort: shortTokenSupply,
                  supplyLong: longTokenSupply,
                  referenceAsset,
                  collateralToken,
                  dataFeedProvider,
                })
                .then((val) => {
                  console.log('created continent pool')
                  console.log(val)
                })
                .catch((err) => {
                  console.error(err.message)
                })
            }
          }}
        >
          Submit input
        </Button>
      </Box>
    </Container>
  )
}
