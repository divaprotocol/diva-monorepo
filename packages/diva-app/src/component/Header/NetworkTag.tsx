import { Chip } from '@mui/material'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectChainId } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'

export function NetworkTag() {
  const { isConnected } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)

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
