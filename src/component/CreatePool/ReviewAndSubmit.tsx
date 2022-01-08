import {
  Button,
  Card,
  CardActions,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { useCreatePoolFormik } from './formik'

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

const dict: {
  [key: string]: any
} = {
  referenceAsset: 'Reference Asset',
  expiryDate: 'Expiry Date',
  floor: 'Floor',
  cap: 'Ceiling',
  inflection: 'Inflection',
  collateralBalanceShort: 'CollateralBalance (Short)',
  collateralBalanceLong: 'CollateralBalance (Long)',
  shortTokenSupply: 'Token Supply (Short)',
  longTokenSupply: 'Token Supply (Long)',
  dataFeedProvider: 'Data Feed Provider',
  collateralTokenSymbol: 'Collateral Token',
}

export function ReviewAndSubmit({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { values } = formik
  const theme = useTheme()

  return (
    <Container maxWidth="md">
      <Box pt={5}>
        <Card variant="outlined">
          <CardContent>
            <Typography pb={1} variant="subtitle1">
              Please review the configuration before creating the pool
            </Typography>
          </CardContent>
          <CardContent sx={{ padding: 0 }}>
            <TableContainer sx={{ padding: 0, margin: 0 }}>
              <Table>
                <TableBody>
                  {Object.keys(values)
                    .filter(
                      (v) =>
                        ![
                          'collateralBalance',
                          'collateralWalletBalance',
                          'step',
                        ].includes(v)
                    )
                    .map((key: any) => (
                      <TableRow key={key}>
                        <TableCell>
                          <strong>{dict[key] || key}</strong>
                        </TableCell>
                        <TableCell align="right">
                          {stringifyValue((values as any)[key])}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
          <CardActions
            sx={{
              justifyContent: 'space-between',
            }}
          >
            <Button
              onClick={() => {
                formik.setFieldValue('step', 2)
              }}
            >
              Go Back
            </Button>
            <Button
              size="large"
              disabled={!formik.isValid}
              onClick={(e: any) => {
                formik.handleSubmit(e)
              }}
            >
              Submit input
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Container>
  )
}
