import Header from './Header/Header'
import { BrowserRouter as Router } from 'react-router-dom'
import MenuItems from './/Header/MenuItems'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useCustomMediaQuery } from '../hooks/useCustomMediaQuery'

const Layout = ({ children }) => {
  const { isMobile } = useCustomMediaQuery()

  return (
    <Router>
      <Stack height="100%" direction="row" justifyContent="space-between">
        {!isMobile && (
          <>
            <MenuItems />
            <Divider orientation="vertical" />
          </>
        )}
        <Container
          sx={{
            alignItems: 'left',
            width: '100%',
            height: '100%',
            overflow: 'auto',
          }}
          maxWidth={false}
        >
          <Header />
          {children}
        </Container>
      </Stack>
    </Router>
  )
}

export default Layout
