import { Chip } from '@mui/material'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'

export function NetworkTag() {
  const { isConnected } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)
  const userAddress = useAppSelector(selectUserAddress)
  if (isConnected && userAddress) {
    return (
      <Chip
        label={config[chainId]?.name || 'Unsupported'}
        sx={{ marginLeft: 'auto' }}
      />
    )
  } else {
    return <Chip label={'Preview (Goerli)'} sx={{ marginLeft: 'auto' }} />
  }
}
