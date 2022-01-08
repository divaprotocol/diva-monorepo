import {
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  FormControl,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useCreatePoolFormik } from './formik'

export function SelectDataFeedProvider({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const theme = useTheme()
  return (
    <Container maxWidth="md">
      <Card variant="outlined">
        <CardContent>
          <Typography pb={1} variant="subtitle1">
            Select a <strong>trusted</strong> Data Feed Provider for this pool.
          </Typography>
          <FormControl
            fullWidth
            sx={{
              paddingTop: theme.spacing(5),
              paddingBottom: theme.spacing(5),
            }}
          >
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
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-between' }}>
          <Button
            onClick={() => {
              formik.setFieldValue('step', 1, true)
            }}
          >
            Go Back
          </Button>

          <Button
            onClick={(event: any) => {
              formik.handleSubmit(event)
            }}
            disabled={!formik.isValid}
          >
            Next
          </Button>
        </CardActions>
      </Card>
    </Container>
  )
}
