import { useState } from 'react'
import { Box, Step, StepLabel, Stepper } from '@mui/material'
import Container from '@mui/material/Container'
import { DefinePoolAttributes } from './DefinePoolAttributes'
import { SelectDataFeedProvider } from './SelectDataFeedProvider'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { useCreatePoolFormik } from './formik'

export function CreatePool() {
  const [activeStep, setActiveStep] = useState(0)
  const next = () => setActiveStep((prevActiveStep) => prevActiveStep + 1)
  const previous = () => setActiveStep((prevActiveStep) => prevActiveStep - 1)

  const formik = useCreatePoolFormik()

  let step = null
  switch (activeStep) {
    case 0:
      step = <DefinePoolAttributes formik={formik} next={next} />
      break
    case 1:
      step = (
        <SelectDataFeedProvider
          formik={formik}
          next={next}
          previous={previous}
        />
      )
      break
    case 2:
      step = <ReviewAndSubmit formik={formik} next={next} previous={previous} />
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
