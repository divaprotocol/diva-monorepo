import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { Route, Link } from 'react-router-dom'

export default function MenuItems() {
  return (
    <div>
      <Route
        path="/"
        render={(history) => (
          <Tabs
            indicatorColor="secondary"
            textColor="inherit"
            value={
              history.location.pathname.includes('/trade')
                ? false
                : history.location.pathname
            }
          >
            <Tab label="Markets" value={'/'} component={Link} to={'/'} />
            <Tab
              label="My Dashboard"
              value={'/dashboard/mydatafeeds'}
              component={Link}
              to={'/dashboard/mydatafeeds'}
            />
            <Tab
              label="Create"
              value={'/Create'}
              component={Link}
              to={'/Create'}
            />
          </Tabs>
        )}
      />
    </div>
  )
}
