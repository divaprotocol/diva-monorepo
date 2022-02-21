import { Chip } from '@mui/material'
import { chainIdtoName } from '../../Util/chainIdtoName'
import { useWeb3React } from '@web3-react/core'

export function NetworkTag() {
  const { active, chainId = 3 } = useWeb3React()

  if (active) {
    return <Chip label={chainIdtoName(chainId)} sx={{ marginLeft: 'auto' }} />
  } else {
    return <Chip label={'Preview (ropsten)'} sx={{ marginLeft: 'auto' }} />
  }
}
