import { Drawer, Box, Stack, Button } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import useTheme from '@mui/material/styles/useTheme'

// props for the FilterDrawerMobile component
interface FilterDrawerMobileProps {
  open: boolean
  onClose: (boolean) => void
  children: React.ReactNode
  onApplyFilter: () => void
  onClearFilter: () => void
}

export const FilterDrawerModal = ({
  open,
  onClose,
  children,
  onApplyFilter,
  onClearFilter,
}: FilterDrawerMobileProps) => {
  const theme = useTheme()

  return (
    <Drawer anchor={'bottom'} open={open} onClose={() => onClose(false)}>
      <Box
        sx={{
          height: '100vh',
          backgroundColor: '#000000',
          padding: theme.spacing(3.5),
          position: 'relative',
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: 'relative',
          }}
        >
          <Box
            sx={{
              fontSize: '20px',
              fontWeight: '500',
              letterSpacing: '0.15px',
            }}
          >
            Filters
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: '5px',
              width: '14px',
              top: '2px',
            }}
            onClick={() => onClose(false)}
          >
            <CloseIcon fontSize="small" />
          </Box>
        </Stack>
        {children}
        <Box
          sx={{
            position: 'absolute',
            width: '84%',
            bottom: '50px',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              justifySelf: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              sx={{
                width: '124px',
                height: '42px',
              }}
              onClick={onClearFilter}
            >
              CLEAR ALL
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{
                width: '124px',
                height: '42px',
              }}
              onClick={onApplyFilter}
            >
              APPLY
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  )
}
