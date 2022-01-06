import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  SelectChangeEvent,
  Alert,
  Theme,
} from '@mui/material'
import styled from '@mui/styled-engine'
import Container from '@mui/material/Container'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import whitelistContract from '../../Util/abis/Whitelist.json'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { CopyToClipboard } from '../shared/CopyToClipboard'
import { useCreatePoolFormik } from './formik'

type Oracle = {
  name: string
  whitelisted: boolean
  address: string
  reputationScore?: number
  tvl?: number
}

const Whitelist = styled('div')<{ whitelisted: boolean }>`
  color: ${({ whitelisted }) => (whitelisted ? 'green' : 'red')};
`
const OracleMenuItem = styled(MenuItem)`
  display: flex;
  justify-content: space-between;
`
const ColumnName = styled('span')`
  font-weight: bold;
`
const LeftColumn = styled(Grid)`
  text-align: right;
  overflow: overlay;
`

const ReputationScore = styled('div')<{
  reputationScore: Oracle['reputationScore']
  theme?: Theme
}>`
  color: ${({ reputationScore, theme }) =>
    reputationScore
      ? reputationScore > 90
        ? theme.palette.success.main
        : theme.palette.warning.main
      : 'currentColor'};
`

const useOracles = (): [Oracle[], string | null] => {
  const [oracles, setOracles] = useState<Oracle[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Please review the approach for getting data from contract using ethers
    const fetchOracles = async () => {
      if (!window.ethereum) {
        setError('No wallet found')
        return
      }

      try {
        // TODO: Improve error for when account is not connected
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const connectedContract = new ethers.Contract(
          '0xa798494fC5d7b5F9225F1D35d73EF9c8E63fd2c1',
          whitelistContract.abi,
          signer
        )

        const fakeProviderName = ['Chainlink', 'Diva', 'Binance']
        const providers: string[] = await connectedContract.getAllProviders()
        const mapedProviders = providers.map((provider, i) => ({
          name: fakeProviderName[i],
          whitelisted: true,
          address: provider,
        }))

        setOracles(mapedProviders)
      } catch (e) {
        const errorMessage =
          e instanceof Error ? e.message : 'Something went wrong'
        setError(errorMessage)
      }
    }

    fetchOracles()
  }, [])

  return [oracles, error]
}

export function SelectDataFeedProvider({
  next,
  previous,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
  next: () => void
  previous: () => void
}) {
  const [oracles, error] = useOracles()
  const [selectedOracle, setSelectedOracle] = useState<Oracle | null>()
  const onSelectOracle = (event: SelectChangeEvent<string>) => {
    setSelectedOracle(oracles[0])
    const oracleName = event.target.value
    const oracle = oracles.find(({ name }) => name === oracleName)
    if (oracle) {
      setSelectedOracle(oracle)
    }
  }

  const getFormattedNumber = (originalNumber: Oracle['tvl']) => {
    if (originalNumber === undefined) {
      return 'N/A'
    }

    return `$${originalNumber.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  const getReputationScoreText = (score: Oracle['reputationScore']) => {
    if (score === undefined) {
      return 'N/A'
    }

    return score > 90 ? `High (${score})%` : `Low (${score})%`
  }

  const oracleInfo = selectedOracle && (
    <Box>
      <Grid container spacing={2} columns={16}>
        <Grid item xs={8}>
          <ColumnName>Address</ColumnName>
        </Grid>
        <LeftColumn item xs={8}>
          {getShortenedAddress(selectedOracle.address)}
          <CopyToClipboard textToCopy={selectedOracle.address} />
        </LeftColumn>
        <Grid item xs={8}>
          <ColumnName>Reputation score</ColumnName>
        </Grid>
        <LeftColumn item xs={8}>
          <ReputationScore
            reputationScore={selectedOracle.reputationScore || 0}
          >
            {getReputationScoreText(selectedOracle.reputationScore)}
          </ReputationScore>
        </LeftColumn>

        <Grid item xs={8}>
          <ColumnName>Backing TVL</ColumnName>
        </Grid>
        <LeftColumn item xs={8}>
          {getFormattedNumber(selectedOracle.tvl)}
        </LeftColumn>
      </Grid>
    </Box>
  )

  return (
    <Container maxWidth="xs">
      <Box>
        <Box pb={3} pt={4}>
          <FormControl fullWidth style={{ paddingRight: '3em' }}>
            <InputLabel>Oracle</InputLabel>
            <Select
              label="Oracle"
              defaultValue={''}
              value={selectedOracle ? selectedOracle.name : ''}
              renderValue={(value) => value}
              onChange={onSelectOracle}
              disabled={!!error}
            >
              {oracles.map(({ name, whitelisted }) => (
                <OracleMenuItem key={name} value={name}>
                  {name}
                  <Whitelist whitelisted={whitelisted}>
                    {whitelisted ? 'Whitelisted' : 'Not whitelisted'}
                  </Whitelist>
                </OracleMenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {error && (
          <Box>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        {oracleInfo}
      </Box>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button onClick={() => next()}>Next</Button>
      </Box>
    </Container>
  )
}
