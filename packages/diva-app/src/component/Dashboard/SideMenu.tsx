import { Box, Button, Stack } from '@mui/material'
import { Link } from 'react-router-dom'
import DataThresholdingOutlinedIcon from '@mui/icons-material/DataThresholdingOutlined'
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined'
import RssFeedOutlinedIcon from '@mui/icons-material/RssFeedOutlined'
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined'
export function SideMenu() {
  return (
    <Stack
      direction="column"
      flexDirection="column"
      spacing={2}
      sx={{
        paddingLeft: '2em',
        paddingTop: '3em',
        alignItems: 'left',
      }}
    >
      <Button component={Link} to="/dashboard/mypositions" variant="text">
        <DataThresholdingOutlinedIcon fontSize="large" sx={{ mr: '0.3em' }} />
        My Positions
      </Button>
      <Button fullWidth variant="text">
        <ShoppingCartCheckoutOutlinedIcon
          fontSize="large"
          sx={{ mr: '0.3em', ml: '-0.4em' }}
        />
        My Orders
      </Button>
      <Button component={Link} to="/dashboard/mydatafeeds" variant="text">
        <RssFeedOutlinedIcon
          fontSize="large"
          sx={{ mr: '0.3em', ml: '0.4em' }}
        />
        My Data Feeds
      </Button>
      <Button component={Link} to="/dashboard/myfeeclaims" variant="text">
        <ReceiptOutlinedIcon
          fontSize="large"
          sx={{ mr: '0.3em', ml: '0.4em' }}
        />
        My Fee Claims
      </Button>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          paddingTop: '32em',
        }}
      >
        <Button variant="text">Privacy Policy</Button>
        <Button variant="text">Terms of Use</Button>
      </Box>
    </Stack>
  )
}
