import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { App } from './App'
import reportWebVitals from './reportWebVitals'
import store from './Redux/Store'
import { Provider } from 'react-redux'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import { Box } from '@mui/system'

const WithProviders = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  )
  return (
    <Box
      sx={{
        background: theme.palette.background.default,
        color: theme.palette.text.secondary,
        fill: theme.palette.text.secondary,
        stroke: theme.palette.text.secondary,
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <App />
        </Provider>
      </ThemeProvider>
    </Box>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <WithProviders />
  </React.StrictMode>,
  document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
