import { Chip } from '@mui/material'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export function NetworkTag() {
  const { isConnected, chainId } = useConnectionContext()

  if (isConnected) {
    return (
      <Chip
        label={config[chainId]?.name || 'Unsupported'}
        sx={{ marginLeft: 'auto' }}
      />
    )
  } else {
    return <Chip label={'Preview (ropsten)'} sx={{ marginLeft: 'auto' }} />
  }
}
