import Link from 'next/link'
import { Button, Stack } from '@mui/material'

export default function MenuItems() {
  return (
    <Stack sx={{ flexDirection: 'row ' }}>
      <Link href="/" passHref>
        <Button LinkComponent="a">Markets</Button>
      </Link>
      <Link href="/dashboard/mydatafeeds">
        <Button LinkComponent="a" sx={{ whiteSpace: 'nowrap' }}>
          My dashboard
        </Button>
      </Link>
      <Link href="/create" passHref>
        <Button LinkComponent="a">Create</Button>
      </Link>
    </Stack>
  )
}
