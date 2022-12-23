import { Box, Button, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { matchPath, useHistory, useLocation } from 'react-router-dom'
import { APP_BAR_ITEMS, ICONS_URL } from '../../constants'
import { useState } from 'react'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

export default function MenuItems() {
  const location = useLocation()
  const history = useHistory()
  const [navOpen, setNavOpen] = useState(false)
  const handleButtonClick = (path) => {
    if (path === '/Create' && location.pathname.startsWith('/Create')) {
      window.location.reload()
    } else {
      history.push(path)
    }
  }

  return (
    <Stack
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      marginTop="16px"
      width={navOpen ? '182px' : '67px'}
      sx={{
        position: 'relative',
      }}
    >
      <Button onClick={() => history.push('/')}>
        <Box
          sx={{
            width: 30,
            display: 'flex',
            justifyContent: 'center',
            minHeight: '50px',
          }}
        >
          <img
            src={ICONS_URL.divaSidebarLogo}
            alt="diva"
            width={!navOpen ? '24px' : '0'}
          />
          <img
            src={ICONS_URL.divaTextLogo}
            alt="diva"
            width={navOpen ? '90px' : '0'}
          />
        </Box>
      </Button>
      <Box
        sx={{
          marginTop: '80px',
          borderTop: '1px solid #4F4F4F',
        }}
      >
        {APP_BAR_ITEMS.map(({ label, to, icon, isRoot }, key) => {
          const Icon = icon
          const isActive =
            isRoot && location.pathname.startsWith('/markets/')
              ? true
              : matchPath(location.pathname, {
                  path: to,
                  exact: true,
                })

          return (
            <Button
              disableRipple
              style={{ backgroundColor: 'transparent' }}
              onClick={() => handleButtonClick(to)}
              key={key}
            >
              <Box
                sx={{
                  width: `${navOpen ? '182px' : '67px'}`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gridGap: '14px',
                    color: '#BDBDBD',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    height: '70px',
                    borderBottom: '1px solid #4F4F4F',
                    paddingLeft: '23px',
                  }}
                >
                  <Tooltip title={!navOpen ? label : ''}>
                    <Icon color={isActive ? 'primary' : 'action'} />
                  </Tooltip>
                  <Box
                    sx={{
                      display: `${navOpen ? 'block' : 'none'}`,
                    }}
                  >
                    {label}
                  </Box>
                </Box>
              </Box>
            </Button>
          )
        })}
      </Box>
      <Button
        onClick={() => setNavOpen(!navOpen)}
        style={{
          position: 'absolute',
          background: '#4F4F4F',
          borderRadius: '0px 5px 5px 0px',
          height: '24.1px',
          minWidth: '23px',
          zIndex: '9999999999',
          padding: '0px',
          top: '76px',
          right: '-25px',
          color: '#121212',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `${navOpen ? 'rotate(180deg)' : 'rotate(0deg)'}`,
          }}
        >
          <ArrowRightIcon />
        </Box>
      </Button>
    </Stack>
  )
}
