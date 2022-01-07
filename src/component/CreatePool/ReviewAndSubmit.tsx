import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'
import { useQuery } from 'react-query'

import { useDiva } from '../../hooks/useDiva'
import { Tokens } from '../../lib/types'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { useCreatePoolFormik } from './formik'

export function ReviewAndSubmit({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
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
    collateralTokenSymbol,
    dataFeedProvider,
  } = values
  const stringifyValue = (val: unknown) => {
    if (val instanceof Date) {
      return val.toDateString()
    } else if (typeof val === 'string') {
      if (val.length > 10) {
        return getShortenedAddress(val)
      }
      return val
    } else if (typeof val === 'number') {
      return `${val}`
    }
    return ''
  }

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/ropstenTokens.json').then((res) => res.json())
  )

  console.log({ values })

  const collateralTokenAssets = tokensQuery.data || {}
  const collateralToken = collateralTokenAssets[collateralTokenSymbol as string]

  return (
    <Container maxWidth="xs">
      <Box pt={5}>
        <TableContainer>
          <Table size="small">
            <TableBody>
              {Object.keys(values)
                .filter(
                  (v) =>
                    ![
                      'collateralBalance',
                      'collateralWalletBalance',
                      'step',
                      'collateralTokenSymbol',
                    ].includes(v)
                )
                .map((key: any) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell align="right">
                      {stringifyValue((values as any)[key])}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Box pt={5} pb={3}>
        <Button
          onClick={() => {
            formik.setFieldValue('step', 2)
          }}
        >
          Back
        </Button>
        <Button
          size="large"
          disabled={!formik.isValid}
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
