import { AppBar, Box, Button, Toolbar } from '@mui/material'
import { useEffect, useState } from 'react'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import CloseIcon from '@mui/icons-material/Close'
import { NetworkTag } from './NetworkTag'

export default function Header() {
  const [showBanner, setShowBanner] = useState(true)
  useEffect(() => {
    const data = window.localStorage.getItem('DIVA_BANNER')
    if (data !== null) setShowBanner(JSON.parse(data))
  }, [])

  useEffect(() => {
    window.localStorage.setItem('DIVA_BANNER', JSON.stringify(showBanner))
  }, [showBanner])

  return (
    <Box>
      <AppBar position="static" sx={{ background: 'none', boxShadow: 'none' }}>
        {showBanner && (
          <AppBar
            position="static"
            sx={{ background: '#3393E0', boxShadow: 'none' }}
          >
            <Box textAlign="center">
              <Button href="" sx={{ color: '#FFFFFF' }}>
                🚀 Learn how to earn $DIVA tokens for trying out the app
              </Button>
              <Button
                variant="contained"
                disableElevation
                sx={{ color: '#FFFFFF' }}
                onClick={() => {
                  setShowBanner(false)
                }}
              >
                <CloseIcon />
              </Button>
            </Box>
          </AppBar>
        )}
        <Toolbar>
          <NetworkTag />
          <ConnectWalletButton />
        </Toolbar>
      </AppBar>
    </Box>
  )
}
