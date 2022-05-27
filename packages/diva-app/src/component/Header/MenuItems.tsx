import { Box, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../Logo'
import TaskIcon from '@mui/icons-material/Task'
export default function MenuItems() {
  const location = useLocation()

  return (
    <Stack
      width="70px"
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
      marginTop="16px"
      spacing={3}
    >
      <Link to="/">
        <Box sx={{ width: 30, marginBottom: 5 }}>
          <Logo />
        </Box>
      </Link>
      <Link to="/">
        <Tooltip title="Market">
          <ShowChartOutlined
            color={location.pathname === '/' ? 'primary' : 'action'}
          />
        </Tooltip>
      </Link>
      <Link to="/dashboard/mypositions">
        <Tooltip title=" My Dashboard">
          <Person
            color={
              location.pathname.startsWith('/dashboard') ? 'primary' : 'action'
            }
          />
        </Tooltip>
      </Link>
      <Link to="/Create">
        <Tooltip title="Create Pool">
          <Add
            color={
              location.pathname.toLowerCase() === '/create'
                ? 'primary'
                : 'action'
            }
          />
        </Tooltip>
      </Link>
      <Link to="/tasks">
        <Tooltip title="Create Pool">
          <TaskIcon
            color={
              location.pathname.toLowerCase() === '/tasks'
                ? 'primary'
                : 'action'
            }
          />
        </Tooltip>
      </Link>
    </Stack>
  )
}
