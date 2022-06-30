import { Chip } from '@mui/material'
import { CHAIN_INFO } from '../../constants/index'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import ChainSelectorModal from './ChainSelectorModal'
import { useState } from 'react'

export function NetworkTag() {
  const { isConnected } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)
  const userAddress = useAppSelector(selectUserAddress)

  const [isChainSelectorModalOpen, setIsChainSelectorModalOpen] =
    useState<boolean>(false)

  if (isConnected && userAddress) {
    return (
      <>
        <Chip
          label={CHAIN_INFO[chainId].label || 'Unsupported'}
          sx={{ marginLeft: 'auto' }}
          onClick={() => setIsChainSelectorModalOpen(true)}
        />
        <ChainSelectorModal
          onClose={() => setIsChainSelectorModalOpen(false)}
          isOpen={isChainSelectorModalOpen}
        />
      </>
    )
  } else {
    return <Chip label={'Preview (Ropsten)'} sx={{ marginLeft: 'auto' }} />
  }
}
