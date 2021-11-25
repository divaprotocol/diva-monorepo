import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { App } from './App'
import reportWebVitals from './reportWebVitals'
import store from './Redux/Store'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import { Box } from '@mui/system'
import { createDivaTheme } from './lib/createDivaTheme'
import Web3 from 'web3'
import { Web3ReactProvider } from '@web3-react/core'

function getLibrary(provider: any) {
  return new Web3(provider)
}

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
      <Web3ReactProvider getLibrary={getLibrary}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <App />
          </Provider>
        </ThemeProvider>
      </Web3ReactProvider>
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
