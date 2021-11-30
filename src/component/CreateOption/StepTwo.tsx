import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  SelectChangeEvent,
  Link,
} from '@mui/material'
import Container from '@mui/material/Container'
import { useState } from 'react'
import styled from 'styled-components'

type Oracle = {
  name: string
  symbol: string
  whitelisted: boolean
  address: string
  reputationScore: number
  tvl: number
  factSheet: string
}

const Whitelist = styled.div<{ whitelisted: boolean }>`
  color: ${({ whitelisted }) => (whitelisted ? 'green' : 'red')};
`
const OracleMenuItem = styled(MenuItem)`
  display: flex;
  justify-content: space-between;

  &[aria-expanded='false'] {
    ${Whitelist} {
      display: none;
    }
  }
`
const ColumnName = styled.span`
  font-weight: bold;
`
const LeftColumn = styled(Grid)`
  text-align: right;
  overflow: overlay;
  text-overflow: ellipsis;
`
const ReputationScore = styled.div<{ reputationScore: number }>`
  color: ${({ reputationScore }) => (reputationScore > 90 ? 'green' : 'red')};
`

const useOracles = (): [Oracle[]] => {
  const oracles: Oracle[] = [
    {
      name: 'Chainlink',
      symbol: 'LINK',
      whitelisted: true,
      address: '0x29D7d1dd5B6f9C864d9db560D72a247c178aE86B',
      reputationScore: 99.9,
      tvl: 1104478,
      factSheet: 'http://chainlink.org/',
    },
    {
      name: 'Binance',
      symbol: 'BSC',
      whitelisted: true,
      address: '0x34d7d1dd5B6f9C864d9db560D72a247c178aE86B',
      reputationScore: 97.4,
      tvl: 2104478,
      factSheet: 'http://binance.com/',
    },
  ]
  return [oracles]
}

export function StepTwo({
  next,
  previous,
}: {
  next: () => void
  previous: () => void
}) {
  const [oracles] = useOracles()
  const [selectedOracle, setSelectedOracle] = useState<Oracle | null>()
  const onSelectOracle = (event: SelectChangeEvent<string>) => {
    setSelectedOracle(oracles[0])
    const oracleName = event.target.value
    const oracle = oracles.find(({ name }) => name === oracleName)
    if (oracle) {
      setSelectedOracle(oracle)
    }
  }

  const getFormattedNumber = (originalNumber: number) => {
    return `$${originalNumber.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }
  const getReputationScoreText = (score: number) =>
    score > 90 ? `High (${score})%` : `Low (${score})%`

  const oracleInfo = selectedOracle && (
    <Grid container spacing={2} columns={16}>
      <Grid item xs={8}>
        <ColumnName>Address</ColumnName>
      </Grid>
      <LeftColumn item xs={8}>
        {selectedOracle.address}
      </LeftColumn>

      <Grid item xs={8}>
        <ColumnName>Reputation score</ColumnName>
      </Grid>
      <LeftColumn item xs={8}>
        <ReputationScore reputationScore={selectedOracle.reputationScore}>
          {getReputationScoreText(selectedOracle.reputationScore)}
        </ReputationScore>
      </LeftColumn>

      <Grid item xs={8}>
        <ColumnName>Backing TVL</ColumnName>
      </Grid>
      <LeftColumn item xs={8}>
        {getFormattedNumber(selectedOracle.tvl)}
      </LeftColumn>
      <Grid item xs={16} style={{ textAlign: 'center' }}>
        <Link target="_blank" rel="noreferrer" href={selectedOracle.factSheet}>
          Data Fact Sheet
        </Link>
      </Grid>
    </Grid>
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
            >
              {oracles.map(({ name, symbol, whitelisted }) => (
                <OracleMenuItem key={symbol} value={name}>
                  {name}
                  <Whitelist whitelisted={whitelisted}>
                    {whitelisted ? 'Whitelisted' : 'Not whitelisted'}
                  </Whitelist>
                </OracleMenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>{oracleInfo}</Box>
      </Box>
      <Box pb={3}>
        <Button onClick={() => previous()}>Back</Button>
        <Button onClick={() => next()}>Next</Button>
      </Box>
    </Container>
  )
}
