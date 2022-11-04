import { LoadingButton } from '@mui/lab'
import { Box, Button, Typography, Theme, useTheme } from '@mui/material'
import { useState } from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import SelectorModal from '../Header/SelectorModal'
import styled from '@emotion/styled'
import { WALLET_IMAGES } from '../../constants'
import useLocalStorage from 'use-local-storage'

const SUPPORTED_WALLET_LIST = [
  {
    name: 'metamask',
    image: WALLET_IMAGES.metamask,
    label: 'Metamask',
  },
  {
    name: 'walletconnect',
    image: WALLET_IMAGES.walletConnect,
    label: 'WalletConnect',
  },
]

const WalletInfoContainer = styled.div<{
  theme: Theme
}>`
  display: flex;
  padding: 14px;
  align-items: center;
  border: 1px solid rgb(67, 72, 77);
  cursor: pointer;

  &:hover {
    border: 1px solid ${(props) => props.theme.palette.primary.main};
  }
`

const WalletInfo = ({
  onClose,
  wallet,
}: {
  onClose: () => void
  wallet: {
    label: string
    name: string
    image: string
  }
}) => {
  const theme = useTheme()
  const { connect } = useConnectionContext()
  const [{ connected }] = useLocalStorage<{
    connected?: string
  }>('diva-dapp-connection', {})

  const handleWalletClick = async () => {
    if (wallet.name === 'metamask') {
      connect('metamask')
    } else {
      connect('walletconnect')
    }
    onClose()
  }

  return (
    <WalletInfoContainer theme={theme} onClick={handleWalletClick}>
      <>
        <div>
          <img
            src={wallet.image}
            alt={wallet.name}
            style={{
              width: '40px',
              marginRight: '12px',
            }}
          />
        </div>
        <div>
          <Typography variant="h3">{wallet.label}</Typography>
          <Typography
            variant="h6"
            sx={{
              opacity: 0.5,
            }}
          >
            {connected === wallet.name && 'Connected'}
          </Typography>
        </div>
      </>
    </WalletInfoContainer>
  )
}

export function ConnectWalletButton() {
  const { isConnected, disconnect } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)
  const { isMobile } = useCustomMediaQuery()
  const [isWalletSelectorModalOpen, setIsWalletSelectorModalOpen] =
    useState<boolean>(false)

  return (
    <>
      <Box>
        {isConnected ? (
          <LoadingButton
            variant="contained"
            color="primary"
            size={isMobile ? 'small' : 'large'}
            loading={chainId == null}
            type="submit"
            value="Submit"
            sx={{ marginLeft: '10px' }}
            onClick={() => isConnected && userAddress && disconnect()}
          >
            {isConnected && userAddress
              ? getShortenedAddress(userAddress)
              : 'Connect Wallet'}
          </LoadingButton>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ marginLeft: '10px', textDecoration: 'capitalize' }}
            size={isMobile ? 'small' : 'large'}
            onClick={() => {
              setIsWalletSelectorModalOpen(true)
            }}
          >
            Connect Wallet
          </Button>
        )}
      </Box>
      <SelectorModal
        onClose={() => setIsWalletSelectorModalOpen(false)}
        isOpen={isWalletSelectorModalOpen}
        header="Connect Wallet"
      >
        {SUPPORTED_WALLET_LIST.map((wallet, index) => (
          <WalletInfo
            key={index}
            onClose={() => setIsWalletSelectorModalOpen(false)}
            wallet={wallet}
          />
        ))}
      </SelectorModal>
    </>
  )
}
