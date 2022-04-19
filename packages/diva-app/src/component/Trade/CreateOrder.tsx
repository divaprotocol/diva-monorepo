import { Button, TextField } from '@mui/material'
import React from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '../../Redux/hooks'
import { poolSelector } from '../../Redux/poolSlice'

export default function CreateOrder() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const isLong = params.tokenType === 'long'
  const pool = useAppSelector((state) => poolSelector(state, params.poolId))

  return (
    <div>
      <TextField label="You buy" />
      <TextField label="Price per token" />
      <Button>Approve</Button>
      <Button disabled>Fill order</Button>
    </div>
  )
}
