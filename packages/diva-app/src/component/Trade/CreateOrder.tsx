import { Button, TextField } from '@mui/material'

export default function CreateOrder() {
  return (
    <div>
      <TextField label="You buy" />
      <TextField label="Price per token" />
      <Button>Approve</Button>
      <Button disabled>Fill order</Button>
    </div>
  )
}
