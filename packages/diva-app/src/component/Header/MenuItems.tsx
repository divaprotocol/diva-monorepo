import { Box, Button, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { Link, matchPath, useLocation } from 'react-router-dom'
import { APP_BAR_ITEMS, ICONS_URL } from '../../constants'
import { useState } from 'react'
import ArrowRightIcon from '@mui/icons-material/ArrowRight'

export default function MenuItems() {
  const location = useLocation()

  const [navOpen, setNavOpen] = useState(true)

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
      <Link to="/">
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
      </Link>
      <Box
        sx={{
          marginTop: '80px',
          borderTop: '1px solid #4F4F4F',
        }}
      >
        {APP_BAR_ITEMS.map(({ label, to, icon }) => {
          const Icon = icon
          const isActive = matchPath(location.pathname, {
            path: to,
            exact: true,
          })
          return (
            <Link
              to={to}
              style={{
                textDecoration: 'none',
              }}
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
            </Link>
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
        <ArrowRightIcon />
      </Button>
    </Stack>
  )
}
