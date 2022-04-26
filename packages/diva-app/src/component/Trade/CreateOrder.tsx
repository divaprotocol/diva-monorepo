import { Button, Stack, TextField, Typography } from '@mui/material'
import { SmallButton } from '../SmallButton'

export default function CreateOrder() {
  return (
    <div>
      <Stack padding={3} spacing={4}>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <SmallButton active>Buy</SmallButton>
            <SmallButton>Small</SmallButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <SmallButton active>Fill order</SmallButton>
            <SmallButton>Create order</SmallButton>
          </Stack>
        </Stack>
        <TextField label="You buy" />
        <TextField label="Price per token" />
      </Stack>
      <Button>Approve</Button>
      <Button disabled>Fill order</Button>
    </div>
  )
}
