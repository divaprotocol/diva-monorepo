import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Link from 'next/link'
import { useRouter } from 'next/dist/client/router'

export default function MenuItems() {
  const router = useRouter()
  return (
    <div>
      <Tabs
        indicatorColor="secondary"
        textColor="inherit"
        value={router.pathname.includes('/trade') ? false : router.pathname}
      >
        <Link href="/" passHref>
          <Tab label="Markets" component="a" />
        </Link>
        <Link href="/dashboard/mydatafeeds">
          <Tab label="My Dashboard" component="a" />
        </Link>
        <Link href="/Create" passHref>
          <Tab label="Create" value={'/create'} component="a" />
        </Link>
      </Tabs>
    </div>
  )
}
