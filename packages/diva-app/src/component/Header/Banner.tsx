import { AppBar, Box, Button } from '@mui/material'
export default function Banner() {
  return (
    <AppBar position="static" sx={{ background: '#3393E0', boxShadow: 'none' }}>
      <Box textAlign="center">
        <Button href="/" sx={{ color: '#FFFFFF' }}>
          🚀 Learn how to earn $DIVA tokens for trying out the app
        </Button>
      </Box>
    </AppBar>
  )
}
