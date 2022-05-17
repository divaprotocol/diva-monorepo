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
  }, [marketVariant, dashboardVariant, createVariant])

  return (
    <Stack
      width="70px"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      marginTop="16px"
      spacing={3}
    >
      <Box sx={{ padding: '10px', width: 30, marginBottom: 5 }}>
        <Link to="/">
          <Logo />
        </Link>
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
