import { Button } from '@mui/material'
import { Box } from '@mui/material'
import Container from '@mui/material/Container'

export function StepTwo({
  next,
  previous,
}: {
  next: () => void
  previous: () => void
}) {
  return (
    <Container maxWidth="xs">
      <div>Placeholder</div>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button onClick={() => next()}>Next</Button>
      </Box>
    </Container>
  )
}
