import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { App } from './App'
import reportWebVitals from './reportWebVitals'
import store from './Redux/Store'
import { Provider } from 'react-redux'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import { ThemeProvider } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import { Box } from '@mui/system'
import { createDivaTheme } from './lib/createDivaTheme'
import { QueryClient, QueryClientProvider } from 'react-query'
import 'react-vis/dist/style.css'
import { ConnectionProvider } from './component/ConnectionProvider'

const queryClient = new QueryClient()

const WithProviders = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = React.useMemo(
    () => createDivaTheme(prefersDarkMode),
    [prefersDarkMode]
  )

  return (
    <Box
      sx={{
        background: theme.palette.background.default,
        color: theme.palette.text.secondary,
        fill: theme.palette.text.secondary,
        height: '100vh',
        left: 0,
        top: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <ThemeProvider theme={theme}>
            <Provider store={store}>
              <ConnectionProvider>
                <App />
              </ConnectionProvider>
            </Provider>
          </ThemeProvider>
        </LocalizationProvider>
      </QueryClientProvider>
    </Box>
  )
}

ReactDOM.render(<WithProviders />, document.getElementById('root'))

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
