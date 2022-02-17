import { LocalizationProvider } from '@mui/lab'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import { Box, Container, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Provider } from 'react-redux'
import { Provider as Web3Provider } from '@web3-ui/hooks'
import Header from '../component/Header/Header'
import { projectId } from '../constants'
import store from '../Redux/Store'
import { useMemo } from 'react'
import { createDivaTheme } from '../lib/createDivaTheme'
import '../index.css'
import 'react-vis/dist/style.css'

const queryClient = new QueryClient()

const App = ({ Component, pageProps }) => {
  const prefersDarkMode = true // useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
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
      <Web3Provider network={undefined as any} infuraId={projectId}>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
              <Provider store={store}>
                <Header />
                <Container
                  disableGutters
                  sx={{ alignItems: 'left', height: '100%', overflow: 'auto' }}
                  maxWidth={false}
                >
                  <Component {...pageProps} />
                </Container>
              </Provider>
            </ThemeProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </Web3Provider>
    </Box>
  )
}

export default App
