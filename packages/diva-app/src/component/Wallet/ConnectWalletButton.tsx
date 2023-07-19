import { LoadingButton } from '@mui/lab'
import { Box, Button, Typography, Theme, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import SelectorModal from '../Header/SelectorModal'
import styled from '@emotion/styled'
import { WALLET_IMAGES } from '../../constants'
import useLocalStorage from 'use-local-storage'
import DisclaimerModal from './DisclaimerModal'

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

  const handleWalletClick = async (walletName: string) => {
    try {
      await connect(walletName)
      onClose()
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <WalletInfoContainer
      theme={theme}
      onClick={() => handleWalletClick(wallet.name)}
    >
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

  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [userAgreed, setUserAgreed] = useState(false)

  useEffect(() => {
    // Check if the user has previously agreed to the disclaimer
    const agreementStatus = localStorage.getItem('userAgreed')
    if (agreementStatus) {
      setUserAgreed(true)
    }
  })

  const handleAgree = () => {
    // Store the agreement status in local storage
    localStorage.setItem('userAgreed', 'true')
    setUserAgreed(true)
    setModalIsOpen(false)
    setIsWalletSelectorModalOpen(true)
  }

  const handleDisagree = () => {
    setModalIsOpen(false)
  }

  const buttonSize = isMobile ? 'small' : 'large'
  const buttonStyle = { marginLeft: '10px', textDecoration: 'capitalize' }

  const handleConnect = () => {
    if (isConnected && userAddress) {
      disconnect()
    } else {
      if (userAgreed) {
        setIsWalletSelectorModalOpen(true)
      } else {
        // Show disclaimer modal
        setModalIsOpen(true)
      }
    }
  }

  const buttonText =
    isConnected && userAddress
      ? getShortenedAddress(userAddress)
      : 'Connect Wallet'

  return (
    <>
      <Box>
        {isConnected ? (
          <LoadingButton
            variant="contained"
            color="primary"
            size={buttonSize}
            loading={chainId == null}
            type="submit"
            value="Submit"
            sx={buttonStyle}
            onClick={handleConnect}
          >
            {buttonText}
          </LoadingButton>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size={buttonSize}
            sx={buttonStyle}
            onClick={handleConnect}
          >
            {buttonText}
          </Button>
        )}
      </Box>
      <DisclaimerModal
        isOpen={modalIsOpen}
        onAgree={handleAgree}
        onDisagree={handleDisagree}
      />
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
