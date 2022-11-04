import { useTheme, Theme } from '@mui/material/styles'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import Typography from '@mui/material/Typography'

interface SelectorModalProps {
  onClose: () => void
  isOpen: boolean
  children: React.ReactNode
  header: string
}

const SelectorModal = ({
  onClose,
  isOpen,
  children,
  header,
}: SelectorModalProps) => {
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
            {header}
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
          {children}
        </Box>
      </Box>
    </Modal>
  )
}

export default SelectorModal
