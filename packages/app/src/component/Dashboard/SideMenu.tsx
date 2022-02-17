import { Box, Button, Link, Stack } from '@mui/material'

export function SideMenu() {
  return (
    <Stack
      direction="column"
      flexDirection="column"
      spacing={2}
      sx={{
        paddingLeft: '2em',
        paddingTop: '3em',
        alignItems: 'left',
      }}
    >
      <Link href="/dashboard/mypositions">
        <Button component={'a'} variant="contained">
          My Positions
        </Button>
      </Link>
      <Link href="/dashboard/mydatafeeds">
        <Button component={'a'} variant="contained">
          My Data Feeds
        </Button>
      </Link>
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
  )
}
