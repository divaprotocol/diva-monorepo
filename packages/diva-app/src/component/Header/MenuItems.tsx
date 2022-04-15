import { Box, Divider, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

export default function MenuItems() {
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
        <Logo />
      </Box>
      <Link to="/">
        <Tooltip title="Market">
          <ShowChartOutlined color="action" />
        </Tooltip>
      </Link>
      <Link to="/dashboard/mypositions">
        <Tooltip title=" My Dashboard">
          <Person color="action" />
        </Tooltip>
      </Link>
      <Link to="/Create">
        <Tooltip title="Create Pool">
          <Add color="action" />
        </Tooltip>
      </Link>
      <Divider variant="middle" />
    </Stack>
  )
}
