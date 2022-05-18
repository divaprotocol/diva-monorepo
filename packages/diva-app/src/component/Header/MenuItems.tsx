import { Box, Button, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'
import { useEffect, useState } from 'react'

export default function MenuItems() {
  const [marketVariant, setMarketVariant] = useState<'text' | 'contained'>(
    'text'
  )
  const [dashboardVariant, setDashboardVariant] = useState<
    'text' | 'contained'
  >('text')
  const [createVariant, setCreateVariant] = useState<'text' | 'contained'>(
    'text'
  )
  const variant = (button: string) => {
    switch (button) {
      case 'create':
        return window.location.toString().split('/')[3] === 'Create'
          ? 'contained'
          : 'text'
      case 'dashboard':
        return window.location.toString().split('/')[3] === 'dashboard'
          ? 'contained'
          : 'text'
      case 'market':
        return window.location.toString().split('/')[3] === ''
          ? 'contained'
          : 'text'
    }
  }
  useEffect(() => {
    switch (window.location.toString().split('/')[3]) {
      case 'Create':
        setMarketVariant('text')
        setCreateVariant('contained')
        setDashboardVariant('text')
        break
      case 'dashboard':
        setMarketVariant('text')
        setCreateVariant('text')
        setDashboardVariant('contained')
        break
      default:
        setMarketVariant('contained')
        setCreateVariant('text')
        setDashboardVariant('text')
        break
    }
  }, [])

  return (
    <Stack
      width="70px"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      marginTop="16px"
      spacing={3}
    >
      <Box sx={{ width: 30, marginBottom: 5, paddingRight: 4 }}>
        <Button
          onClick={() => {
            setMarketVariant('contained')
            setCreateVariant('text')
            setDashboardVariant('text')
          }}
        >
          <Logo />
        </Button>
      </Box>
      <Button
        variant={marketVariant}
        onClick={() => {
          setMarketVariant('contained')
          setCreateVariant('text')
          setDashboardVariant('text')
        }}
      >
        <Link to="/">
          <Tooltip title="Market">
            <ShowChartOutlined color="action" />
          </Tooltip>
        </Link>
      </Button>
      <Button
        variant={dashboardVariant}
        onClick={() => {
          setMarketVariant('text')
          setCreateVariant('text')
          setDashboardVariant('contained')
        }}
      >
        <Link to="/dashboard/mypositions">
          <Tooltip title=" My Dashboard">
            <Person color="action" />
          </Tooltip>
        </Link>
      </Button>
      <Button
        variant={createVariant}
        onClick={() => {
          setMarketVariant('text')
          setCreateVariant('contained')
          setDashboardVariant('text')
        }}
      >
        <Link to="/Create">
          <Tooltip title="Create Pool">
            <Add color="action" />
          </Tooltip>
        </Link>
      </Button>
    </Stack>
  )
}
