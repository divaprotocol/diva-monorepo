import { createTheme } from '@mui/material/styles'

/**
 * createDivaTheme
 **
 * Creates diva theme for material ui
 */
export function createDivaTheme(prefersDarkMode: boolean) {
  return createTheme({
    palette: {
      primary: {
        main: '#00CCF3',
      },
      secondary: {
        main: '#00688B',
      },
      mode: prefersDarkMode ? 'dark' : 'light',
    },
  })
}