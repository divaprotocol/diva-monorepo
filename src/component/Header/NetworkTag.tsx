import { chainIdtoName } from '../../Util/chainIdToName'
import { Chip } from '@mui/material'
import { useWallet } from '@web3-ui/core'

export function NetworkTag() {
  // const {
  //   connection: { network },
  // } = useWallet()
  // console.log({ network })
  console.log('hello')
  const chainId = 80001
  const active = true

  if (active) {
    return <Chip label={chainIdtoName(chainId)} sx={{ marginLeft: 'auto' }} />
  } else {
    return <Chip label={'Not Connected'} sx={{ marginLeft: 'auto' }} />
  }
}
