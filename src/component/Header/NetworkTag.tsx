import { useWeb3React } from '@web3-react/core'
import { chainIdtoName } from '../../Util/chainIdToName'
import { Chip } from '@mui/material'

export function NetworkTag() {
  const { active, chainId = 1 } = useWeb3React()
  if (active) {
    return <Chip label={chainIdtoName(chainId)} sx={{ marginLeft: 'auto' }} />
  } else {
    return <Chip label={'Not Connected'} sx={{ marginLeft: 'auto' }} />
  }
}
