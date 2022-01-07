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

export function ReviewAndSubmit({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { values } = formik

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
          onClick={(e: any) => {
            formik.handleSubmit(e)
          }}
        >
          Submit input
        </Button>
      </Box>
    </Container>
  )
}
