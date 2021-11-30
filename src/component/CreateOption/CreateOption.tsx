import { useState } from 'react'
import { Box, Step, StepLabel, Stepper } from '@mui/material'
import Container from '@mui/material/Container'
import { StepOne } from './StepOne'
import { StepTwo } from './StepTwo'
import { StepThree } from './StepThree'

export function CreateOption() {
  const [activeStep, setActiveStep] = useState(0)
  const next = () => setActiveStep((prevActiveStep) => prevActiveStep + 1)
  const previous = () => setActiveStep((prevActiveStep) => prevActiveStep - 1)

  let step = null
  switch (activeStep) {
    case 0:
      step = <StepOne next={next} />
      break
    case 1:
      step = <StepTwo next={next} previous={previous} />
      break
    case 2:
      step = <StepThree next={next} previous={previous} />
      break
  }

  return (
    <Container maxWidth="xs">
      <Box pt={5}>
        <Stepper activeStep={activeStep} alternativeLabel>
          <Step>
            <StepLabel>Assets</StepLabel>
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
