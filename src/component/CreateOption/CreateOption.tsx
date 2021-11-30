import { Box, Step, StepLabel, Stepper } from '@mui/material'
import Container from '@mui/material/Container'
import { StepOne } from './StepOne'

export function CreateOption() {
  return (
    <Container maxWidth="xs">
      <Box pt={5}>
        <Stepper activeStep={0} alternativeLabel>
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
        <StepOne />
      </Box>
    </Container>
  )
}
