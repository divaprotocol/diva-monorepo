import { Chip } from '@mui/material'
import { useNetwork } from 'wagmi'

export function NetworkTag() {
  const [{ data, loading }] = useNetwork()

  if (loading!) {
    return <Chip label={data.chain.id} sx={{ marginLeft: 'auto' }} />
  } else {
    return <Chip label={'Preview (ropsten)'} sx={{ marginLeft: 'auto' }} />
  }
}
