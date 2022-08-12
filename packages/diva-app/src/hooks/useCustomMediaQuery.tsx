import { useMediaQuery, useTheme } from '@mui/material'

export const useCustomMediaQuery = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  return {
    isMobile,
    isDesktop,
  }
}
