import {
  Box,
  Button,
  Container,
  FormControl,
  Stack,
  TextField,
} from '@mui/material'
import { useCreatePoolFormik } from './formik'

export function SelectDataFeedProvider({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  return (
    <Container maxWidth="sm">
      <Box pt={5}>
        <FormControl fullWidth>
          <TextField
            name="dataFeedProvider"
            error={formik.errors.dataFeedProvider != null}
            helperText={formik.errors.dataFeedProvider}
            id="dataFeedProvider"
            label="Data Feed Provider"
            value={formik.values.dataFeedProvider}
            type="string"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Stack pb={3} pt={5} direction="row" spacing={4}>
        <Button
          onClick={() => {
            formik.setFieldValue('step', 1)
          }}
        >
          Back
        </Button>

        <Button
          onClick={() => {
            formik.setFieldValue('step', 3)
          }}
          disabled={!formik.isValid}
        >
          Next
        </Button>
      </Stack>
    </Container>
  )
}
