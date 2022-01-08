import {
  Alert,
  Box,
  Card,
  CardContent,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material'
import Container from '@mui/material/Container'
import { DefinePoolAttributes } from './DefinePoolAttributes'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { useCreatePoolFormik } from './formik'
import { SelectDataFeedProvider } from './SelectDataFeedProvider'

export function CreatePool() {
  const formik = useCreatePoolFormik()

  let step = null
  switch (formik.values.step) {
    case 1:
      step = <DefinePoolAttributes formik={formik} />
      break
    case 2:
      step = <SelectDataFeedProvider formik={formik} />
      break
    case 3:
      step = <ReviewAndSubmit formik={formik} />
      break
  }

  return (
    <Container maxWidth="md">
      <Box pt={5}>
        <Stepper activeStep={formik.values.step - 1} alternativeLabel>
          <Step>
            <StepLabel>Pool</StepLabel>
          </Step>
          <Step>
            <StepLabel>Oracle</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review</StepLabel>
          </Step>
        </Stepper>
        {formik.status != null && (
          <Alert severity="success">{formik.status}</Alert>
        )}
        {!formik.isValid && (
          <Box pb={3} pt={2}>
            {Object.keys(formik.errors).map((key) => (
              <Box pt={2}>
                <Alert severity="error" key={key}>
                  {key} : {(formik.errors as any)[key]}
                </Alert>
              </Box>
            ))}
          </Box>
        )}

        <Box pt={5} pb={10}>
          {step}
        </Box>
      </Box>
    </Container>
  )
}
