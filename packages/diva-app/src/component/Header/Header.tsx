import { AppBar, Box, Button, Toolbar, useTheme } from '@mui/material'
import { useEffect, useState } from 'react'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import CloseIcon from '@mui/icons-material/Close'
import { NetworkTag } from './NetworkTag'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import Drawer from '@mui/material/Drawer'
import { ICONS_URL, APP_BAR_ITEMS } from '../../constants'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { Link, useLocation, matchPath } from 'react-router-dom'

const MobileMenuList = ({ onClose }) => {
  const location = useLocation()

  return (
    <Box
      sx={{
        width: '160px',
        height: '100%',
        background: '#121212',
        borderRight: '1px solid #4F4F4F',
        padding: '25px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <CloseIcon onClick={onClose} />
        <Box>
          <img src={ICONS_URL.divaSidebarLogo} alt="diva" />
        </Box>
      </Box>
      <Box
        sx={{
          marginTop: '40px',
          height: 'calc(100% - 40px)',
          display: 'flex',
          flexDirection: 'column',
          gridGap: '37px',
        }}
      >
        {APP_BAR_ITEMS.map(({ label, to, icon, isRoot }) => {
          const Icon = icon
          const isActive =
            isRoot && location.pathname.startsWith('/markets/')
              ? true
              : matchPath(location.pathname, {
                  path: to,
                  exact: true,
                })

          return (
            <Link
              to={to}
              key={to}
              onClick={onClose}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gridGap: '14px',
                  textDecoration: 'none',
                  color: '#BDBDBD',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                <Icon color={isActive ? 'primary' : 'action'} />
                <Box>{label}</Box>
              </Box>
            </Link>
          )
        })}
      </Box>
    </Box>
  )
}

export default function Header() {
  const theme = useTheme()
  const { isMobile } = useCustomMediaQuery()

  const [showBanner, setShowBanner] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const data = window.localStorage.getItem('DIVA_BANNER')
    if (data !== null) setShowBanner(JSON.parse(data))
  }, [])

  useEffect(() => {
    window.localStorage.setItem('DIVA_BANNER', JSON.stringify(showBanner))
  }, [showBanner])

  // close the mobile menu when the screen size changes to desktop
  useEffect(() => {
    if (!isMobile) setIsMobileMenuOpen(false)
  }, [isMobile])

  return (
    <>
      <AppBar
        sx={{
          position: 'sticky',
          background: theme.palette.background.default,
          boxShadow: 'none',
        }}
      >
        {showBanner && (
          <AppBar
            position="static"
            sx={{ background: '#3393E0', boxShadow: 'none' }}
          >
            <Box textAlign="center">
              <Button
                href="https://divaprotocol.io/posts/diva-testnet-announcement"
                sx={{ color: '#FFFFFF' }}
              >
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
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
          <NetworkTag />
          <ConnectWalletButton />
        </Toolbar>
      </AppBar>
      <Drawer
        anchor={'left'}
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <MobileMenuList onClose={() => setIsMobileMenuOpen(false)} />
      </Drawer>
    </>
  )
}
