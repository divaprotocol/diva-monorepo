import { Box, Button, Stack } from '@mui/material'

export function SideMenu() {
  return (
    <>
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={2}
      >
        <Button variant="contained">My Positions</Button>
        <Button variant="contained">My Orders</Button>
        <Button variant="contained">My Requests</Button>
        <Button variant="contained">My Data Feeds</Button>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Button variant="text">My Requests</Button>
          <Button variant="text">My Data Feeds</Button>
        </Box>
      </Stack>
    </>
  )
}
