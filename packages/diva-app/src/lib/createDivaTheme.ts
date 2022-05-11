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
        main: '#3393E0',
        light: '#79C7E3',
        dark: '#12939A',
      },
      secondary: {
        main: '#929292',
      },
      mode: 'dark',
      // mode: prefersDarkMode ? 'dark' : 'light',
    },
    typography: {
      h1: {
        fontSize: '34px',
        fontWeight: 400,
      },
      h2: {
        fontSize: '24px',
        fontWeight: 400,
      },
      h3: {
        fontSize: '16px',
      },
      h4: {
        fontSize: '14px',
        fontWeight: '700',
      },
      h5: {
        fontSize: '13px',
      },
      h6: {
        fontSize: '12px',
        fontWeight: '400',
      },
      button: {
        fontSize: '15px',
      },
    },
  })
}
