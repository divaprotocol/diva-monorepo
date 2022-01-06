import { useState } from 'react'
import { Box, Step, StepLabel, Stepper } from '@mui/material'
import Container from '@mui/material/Container'
import { DefinePoolAttributes } from './DefinePoolAttributes'
import { SelectOracle } from './SelectOracle'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { useCreatePoolFormik } from './formik'
import { SelectDataFeedProvider } from './SelectDataFeedProvider'

export function CreatePool() {
  const [activeStep, setActiveStep] = useState(0)
  const next = () => setActiveStep((prevActiveStep) => prevActiveStep + 1)
  const previous = () => setActiveStep((prevActiveStep) => prevActiveStep - 1)

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
    <Container maxWidth="sm">
      <Box pt={5}>
        <Stepper activeStep={activeStep} alternativeLabel>
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
        {step}
      </Box>
    </Container>
  )
}
