import { Box, Button, Stack } from '@mui/material'

const ButtonProps = () => {
  return {
    maxWidth: '220px',
    maxHeight: '40px',
    minWidth: '220px',
    minHeight: '30px',
  }
}
export function SideMenu() {
  return (
    <Stack
      direction="column"
      flexDirection="column"
      spacing={2}
      sx={{
        paddingTop: '3em',
      }}
    >
      <Button variant="contained" style={ButtonProps()}>
        My Positions
      </Button>
      <Button variant="contained" style={ButtonProps()}>
        My Orders
      </Button>
      <Button variant="contained" style={ButtonProps()}>
        My Requests
      </Button>
      <Button variant="contained" style={ButtonProps()}>
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
