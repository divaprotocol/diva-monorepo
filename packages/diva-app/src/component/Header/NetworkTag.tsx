import { Chip } from '@mui/material'
import { useWallet } from '../../hooks/useConnectionContext'

export function NetworkTag() {
  const { connection, connected } = useWallet()

  if (connected) {
    return <Chip label={connection.network} sx={{ marginLeft: 'auto' }} />
  } else {
    return <Chip label={'Preview (ropsten)'} sx={{ marginLeft: 'auto' }} />
  }
}
