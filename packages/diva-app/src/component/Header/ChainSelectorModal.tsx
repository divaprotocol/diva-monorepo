import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import { useTheme, Theme } from '@mui/material/styles'
import {
  ALL_SUPPORTED_CHAIN_IDS,
  config,
  CURRENT_SUPPORTED_CHAIN_ID,
  SupportedChainId,
} from '../../constants'
import styled from '@emotion/styled'
import CloseIcon from '@mui/icons-material/Close'
import { useAppSelector } from '../../Redux/hooks'
import { selectChainId } from '../../Redux/appSlice'
import { utils } from 'ethers'
import Tooltip from '@mui/material/Tooltip'
import SelectorModal from './SelectorModal'
import WalletConnectProvider from '@walletconnect/web3-provider'
import { useConnectionContext } from '../../hooks/useConnectionContext'

// const provider = new WalletConnectProvider({
//   infuraId: '27e484dcd9e3efcfd25a83a78777cdf1',
// })
interface ChainSelectorModalProps {
  onClose: () => void
  isOpen: boolean
}

const NetworkInfoContainer = styled.div<{
  theme: Theme
  isSupportedChain: boolean
}>`
  display: flex;
  padding: 14px;
  align-items: center;
  border: 1px solid rgb(67, 72, 77);
  cursor: ${(props) => (props.isSupportedChain ? 'pointer' : 'not-allowed')};
  opacity: ${(props) => (props.isSupportedChain ? 1 : 0.5)};

  &:hover {
    border: 1px solid ${(props) => props.theme.palette.primary.main};
  }
`

const NetworkInfo = ({
  chainId,
  onClose,
}: {
  chainId: SupportedChainId
  onClose: () => void
}) => {
  const { name, logoUrl } = config[chainId]
  const theme = useTheme()
  const connectedChainId = useAppSelector(selectChainId)
  const isSupportedChain = CURRENT_SUPPORTED_CHAIN_ID.includes(chainId)
  const { sendTransaction } = useConnectionContext()

  const handleNetworkClick = async () => {
    if (!isSupportedChain) return // do nothing if the chain is not supported

    try {
      await sendTransaction({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexStripZeros(utils.hexlify(chainId)) }],
      })
      onClose()
    } catch (err) {
      //TODO: handle error
      console.error(err)
    }
  }

  return (
    <Tooltip title={!isSupportedChain ? 'Coming soon' : ''}>
      <NetworkInfoContainer
        theme={theme}
        onClick={handleNetworkClick}
        isSupportedChain={isSupportedChain}
      >
        <>
          <div>
            <img
              src={logoUrl}
              alt={name}
              style={{
                width: '40px',
                marginRight: '12px',
              }}
            />
          </div>
          <div>
            <Typography variant="h3">{name}</Typography>
            <Typography
              variant="h6"
              sx={{
                opacity: 0.5,
              }}
            >
              {connectedChainId === chainId ? 'Connected' : ''}
            </Typography>
          </div>
        </>
      </NetworkInfoContainer>
    </Tooltip>
  )
}

const ChainSelectorModal = ({ onClose, isOpen }: ChainSelectorModalProps) => {
  const theme = useTheme()

  return (
    <SelectorModal onClose={onClose} isOpen={isOpen} header={'Select network'}>
      {ALL_SUPPORTED_CHAIN_IDS.map((chainId) => (
        <NetworkInfo key={chainId} chainId={chainId} onClose={onClose} />
      ))}
    </SelectorModal>
  )
}

export default ChainSelectorModal
