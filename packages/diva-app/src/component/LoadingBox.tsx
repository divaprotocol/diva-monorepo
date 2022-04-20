import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export function LoadingBox() {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  )
}
