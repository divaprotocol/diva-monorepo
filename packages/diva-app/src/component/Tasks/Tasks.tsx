import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import React from 'react'
import { useStyles } from '../Trade/Orders/UiStyles'
import {
  Box,
  Container,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import DateRangeIcon from '@mui/icons-material/DateRange'
import CampaignIcon from '@mui/icons-material/Campaign'

const columns: GridColDef[] = [
  {
    field: 'Task',
    align: 'left',
    minWidth: 350,
  },
  {
    field: 'Points',
    align: 'left',
  },
  {
    field: 'Status',
    align: 'left',
  },
]

const rows: GridRowModel = [
  {
    id: 1,
    Task: 'Create a pool with a binary payoff',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 2,
    Task: 'Create a pool with a linear',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 3,
    Task: 'Create a pool with a convex payoff',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 4,
    Task: 'Create a pool with a concave payoff',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 5,
    Task: 'Add liquidity to an existing pool',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 6,
    Task: 'Remove the liquidity from an existing pool',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 7,
    Task: 'Create a BUY LIMIT order',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 8,
    Task: 'Create a SELL LIMIT order',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 9,
    Task: 'Fill a BUY LIMIT order',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 10,
    Task: 'Fill a SELL LIMIT order',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 11,
    Task: 'Report final value',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 12,
    Task: 'Challenge reported value',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 13,
    Task: 'Redeem position token',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 14,
    Task: 'Claim fees as a data provider',
    Points: 100,
    Status: 'Open',
  },
  {
    id: 15,
    Task: 'Transfer fee claims',
    Points: 100,
    Status: 'Open',
  },
]

export const Tasks = (props: any) => {
  const classes = useStyles()
  const theme = useTheme()
  return (
    <Stack direction={'row'} height="70%" width="70%">
      <Container>
        <h3>DIVA testnet tasks</h3>
        <DataGrid className={classes.root} rows={rows} columns={columns} />
      </Container>

      <Stack>
        <Box width={theme.spacing(45)} height={theme.spacing(30)}>
          <Typography sx={{ pb: theme.spacing(2) }}>Your progress</Typography>
          <LinearProgress variant={'determinate'} value={33} />
          <Stack direction={'row'} sx={{ justifyContent: 'space-between' }}>
            <Typography>0%</Typography>
            <Typography>100%</Typography>
          </Stack>
        </Box>
        <Box width={theme.spacing(45)} height={theme.spacing(30)}>
          <Container>
            <Typography sx={{ pb: theme.spacing(2) }}>Your rewards</Typography>
          </Container>
          <Stack direction={'row'} sx={{ justifyContent: 'space-between' }}>
            <Container>
              <Typography>Current points</Typography>
              <Typography>-</Typography>
            </Container>
            <Container>
              <Typography>Multiplier</Typography>
              <Typography>-</Typography>
            </Container>
            <Container>
              <Typography>Total points</Typography>
              <Typography>-</Typography>
            </Container>
          </Stack>
        </Box>
        <Box width={theme.spacing(45)} height={theme.spacing(30)}>
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack
              spacing={theme.spacing(2)}
              direction={'row'}
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography>2.0x</Typography>
              <Typography>
                Multiplier for each completed task if you are holding an
                888Whales NFT
              </Typography>
            </Stack>
            <Stack
              spacing={theme.spacing(2)}
              direction={'row'}
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography>1.5x</Typography>
              <Typography>
                Multiplier on total points collected if you complete all the
                tasks
              </Typography>
            </Stack>
            <Stack
              spacing={theme.spacing(3)}
              direction={'row'}
              // sx={{ justifyContent: 'space-between' }}
            >
              <DateRangeIcon />
              <Typography>
                You can complete all tasks until 30th September 2022
              </Typography>
            </Stack>
          </Stack>
        </Box>
        <Box>
          <Stack direction={'row'}>
            <CampaignIcon fontSize={'large'} />
            <Container>
              <Typography>Feedback? Bug reports?</Typography>
              <Typography>Let us know in our discord channel</Typography>
            </Container>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  )
}
