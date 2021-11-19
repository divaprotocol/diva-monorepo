import { AppBar, Box, Toolbar } from '@mui/material'
import { Logo } from '../Logo'
import MenuItems from './MenuItems'

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ paddingRight: 10, width: 30 }}>
          <Logo />
        </Box>
        <MenuItems />
      </Toolbar>
    </AppBar>
  )
}
