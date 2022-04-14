import { Divider, IconButton, Tooltip } from '@mui/material'
import { Stack } from '@mui/material'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import { Link } from 'react-router-dom'

export default function MenuItems() {
  return (
    <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={2}
    >
      <Divider />
      <Link to="/">
        <Tooltip title="Market">
          <IconButton aria-label="Market">
            <ShowChartOutlined />
          </IconButton>
        </Tooltip>
      </Link>
      <Divider />
      <Link to="/dashboard/mypositions">
        <Tooltip title=" My Dashboard">
          <IconButton aria-label="DashBoard">
            <Person />
          </IconButton>
        </Tooltip>
      </Link>
      <Divider />
      <Link to="/Create">
        <Tooltip title="Create">
          <IconButton aria-label="Create">
            <Add />
          </IconButton>
        </Tooltip>
      </Link>
      <Divider />
    </Stack>
  )
}
