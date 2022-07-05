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

  const handleNetworkClick = async () => {
    if (!isSupportedChain) return // do nothing if the chain is not supported
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexStripZeros(utils.hexlify(chainId)) }],
      })
      onClose()
    } catch (err) {
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
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        backdropFilter: 'blur(5px)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: theme.palette.background.default,
          boxShadow: 24,
          p: 4,
          color: theme.palette.text.primary,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            id="modal-modal-title"
            variant="h3"
            component="h3"
            fontWeight={700}
          >
            Select network
          </Typography>

          <CloseIcon
            sx={{
              cursor: 'pointer',
            }}
            onClick={onClose}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gridGap: '16px',
            marginTop: '16px',
          }}
        >
          {ALL_SUPPORTED_CHAIN_IDS.map((chainId) => (
            <NetworkInfo key={chainId} chainId={chainId} onClose={onClose} />
          ))}
        </Box>
      </Box>
    </Modal>
  )
}

export default ChainSelectorModal
