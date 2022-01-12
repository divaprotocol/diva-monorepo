import {
  Button,
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
    <>
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
    </>
  )
}
