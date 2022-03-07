import { Box, Button, Stack } from '@mui/material'
import { Link } from 'react-router-dom'

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
      <Button component={Link} to="/dashboard/mypositions" variant="contained">
        My Positions
      </Button>
      <Button fullWidth variant="contained">
        My Orders
      </Button>
      <Button component={Link} to="/dashboard/mydatafeeds" variant="contained">
        My Data Feeds
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
