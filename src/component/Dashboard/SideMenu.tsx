import { Box, Button, Container, Stack, useMediaQuery } from '@mui/material'
import React from 'react'
import { createDivaTheme } from '../../lib/createDivaTheme'

const ButtonProps = () => {
  return {
    maxWidth: '220px',
    maxHeight: '40px',
    minWidth: '220px',
    minHeight: '30px',
  }
}
export function SideMenu() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = React.useMemo(
    () => createDivaTheme(prefersDarkMode),
    [prefersDarkMode]
  )
  return (
    <Box
      sx={{
        background: '#272727',
        fill: '#272727',
        display: 'center',
        flexDirection: 'column',
        paddingLeft: '2em',
        paddingRight: '4em',
      }}
    >
      <Stack
        direction="column"
        flexDirection="column"
        spacing={2}
        sx={{
          paddingTop: '3em',
          alignItems: 'left',
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
    </Box>
  )
}
