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
import { defaultChains, Provider as Web3Provider } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { WalletLinkConnector } from 'wagmi/connectors/walletLink'
import { QueryClient, QueryClientProvider } from 'react-query'
import 'react-vis/dist/style.css'
import { projectId } from './constants'
const chains = defaultChains
const queryClient = new QueryClient()
const connectors = ({ chainId }) => {
  let rpcUrl = ''
  switch (chainId) {
    case 1:
      rpcUrl = 'https://mainet.infura.io/v3/'
      break
    case 3:
      rpcUrl = 'https://ropsten.infura.io/v3/'
      break
    case 4:
      rpcUrl = 'https://rinkeby.infura.io/v3/'
      break
    case 137:
      rpcUrl = 'https://polygon-mainnet.infura.io/v3/'
      break
    case 42:
      rpcUrl = 'https://kovan.infura.io/v3/'
      break
    default:
      rpcUrl = 'https://ropsten.infura.io/v3/'
      break
  }

  return [
    new InjectedConnector({
      chains,
      options: { shimDisconnect: true },
    }),
    new WalletConnectConnector({
      options: {
        infuraId: projectId,
        qrcode: true,
      },
    }),
    new WalletLinkConnector({
      options: {
        appName: 'My wagmi app',
        jsonRpcUrl: `${rpcUrl}/${projectId}`,
      },
    }),
  ]
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
      <Web3Provider autoConnect connectors={connectors}>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <Provider store={store}>
                <App />
              </Provider>
            </ThemeProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </Web3Provider>
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
