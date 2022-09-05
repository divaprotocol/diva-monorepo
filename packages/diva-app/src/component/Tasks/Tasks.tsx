import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { useStyles, WhiteText } from '../Trade/Orders/UiStyles'
import {
  Box,
  Container,
  LinearProgress,
  Stack,
  Link,
  Typography,
  useTheme,
  Grid,
} from '@mui/material'
import DateRangeIcon from '@mui/icons-material/DateRange'
import CampaignIcon from '@mui/icons-material/Campaign'
import { config } from '../../constants'
import { useAppSelector } from '../../Redux/hooks'
import { selectPools, selectUserAddress } from '../../Redux/appSlice'
import { useQuery } from 'react-query'
import { OrderFill, queryTestUser, TestUser } from '../../lib/queries'
import request from 'graphql-request'
import TaskIcon from '@mui/icons-material/Task'
import ropstenData from './ropsten-points.json'

const columns: GridColDef[] = [
  {
    field: 'Task',
    align: 'left',
    minWidth: 350,
    renderHeader: (header) => <WhiteText>{'Task'}</WhiteText>,
    renderCell: (cell) => {
      let link = ''
      switch (cell.id) {
        case 1:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/create#create-position-tokens-with-a-binary-payoff'
          break
        case 2:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/create#create-position-tokens-with-a-linear-payoff'
          break

        case 3:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/create#create-position-tokens-with-a-convex-long-payoff-concave-short-payoff'
          break
        case 4:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/create#create-position-tokens-with-a-concave-long-payoff-convex-short-payoff'
          break

        case 5:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/add#add-liquidity-to-an-existing-pool'
          break
        case 6:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/remove#remove-liquidity-from-an-existing-pool'
          break

        case 7:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/trade#create-a-buy-limit-order'
          break
        case 8:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/trade#create-a-sell-limit-order'
          break

        case 9:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/trade#fill-existing-buy-limit-orders-sell-market'
          break

        case 10:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/trade#fill-existing-sell-limit-orders-buy-market'
          break

        case 11:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/settle#report-final-value'
          break

        case 12:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/settle#challenge-a-reported-value'
          break
        case 13:
          link = 'https://docs.divaprotocol.io/guides/diva-app-training/redeem'
          break

        case 14:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/fees#claim-fees-as-a-data-provider'
          break
        case 15:
          link =
            'https://docs.divaprotocol.io/guides/diva-app-training/fees#transfer-fee-claims'
          break
      }

      return (
        <Link href={link} rel="noopener noreferrer" target="_blank">
          <WhiteText>{cell.value}</WhiteText>
        </Link>
      )
    },
  },
  {
    field: 'Points',
    align: 'left',
    renderHeader: (header) => <WhiteText>{'Points'}</WhiteText>,
  },
  {
    field: 'Status',
    align: 'left',
    renderHeader: (header) => <WhiteText>{'Status'}</WhiteText>,
  },
]

const rows: GridRowModel = [
  {
    id: 1,
    Task: 'Create a pool with a binary payoff',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 2,
    Task: 'Create a pool with a linear payoff',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 3,
    Task: 'Create a pool with a convex long token payoff',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 4,
    Task: 'Create a pool with a concave long token payoff',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 5,
    Task: 'Add liquidity to an existing pool',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 6,
    Task: 'Remove the liquidity from an existing pool',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 7,
    Task: 'Create a BUY LIMIT order that gets filled',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 8,
    Task: 'Create a SELL LIMIT order that gets filled',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 9,
    Task: 'Fill a BUY LIMIT order via SELL MARKET',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 10,
    Task: 'Fill a SELL LIMIT order via BUY MARKET',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 11,
    Task: 'Report final value',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 12,
    Task: 'Challenge reported value',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 13,
    Task: 'Redeem position token',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 14,
    Task: 'Claim fees as a data provider',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 15,
    Task: 'Transfer fee claims',
    Points: 200,
    Status: 'Unknown',
  },
]
const NumberLinearProgress = (props: any) => {
  return (
    <Stack spacing={2}>
      <Box>
        <LinearProgress
          variant="determinate"
          sx={{ height: '15px', borderRadius: 1 }}
          value={props.value}
        />
      </Box>
      <Typography
        sx={{
          pl: (props.value - 3).toString() + '%',
        }}
        variant="body2"
        color="textSecondary"
      >{`${props.value}%`}</Typography>
    </Stack>
  )
}
export const Tasks = (props: any) => {
  const classes = useStyles()
  const theme = useTheme()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const pools = useAppSelector((state) => selectPools(state))
  const [calcRows, setCalcRows] = useState(rows)
  const [points, setPoints] = useState(0)
  const [multiplier, setMultiplier] = useState('1.0')
  const [mobile, setMobile] = useState(false)
  const [ropstenProgress, setRopstenProgress] = useState<any>({})
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
  let score = 0
  const testnetUser = useQuery<TestUser>(
    `testnetUser-${userAddress}`,
    async () => {
      const response = request(
        config[chainId].divaSubgraph,
        queryTestUser(userAddress)
      ).then((user) => {
        if (user.testnetUser != null) {
          return user.testnetUser
        } else {
          return {}
        }
      })
      return response
    }
  )

  useEffect(() => {
    if (
      pools != null &&
      testnetUser.data != null &&
      userAddress != null &&
      ropstenData != null
    ) {
      ropstenData.map((data) => {
        if (data.id === userAddress) {
          setRopstenProgress(data)
          console.log(data)
        }
      })
      setCalcRows(
        rows.map((v) => {
          switch (v.id) {
            case 1:
              return {
                ...v,
                Status:
                  testnetUser.data?.binaryPoolCreated == true ||
                  ropstenProgress.binaryPoolCreated == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 2:
              return {
                ...v,
                Status:
                  testnetUser.data?.linearPoolCreated == true ||
                  ropstenProgress.linearPoolCreated == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 3:
              return {
                ...v,
                Status:
                  testnetUser.data?.convexPoolCreated == true ||
                  ropstenProgress.convexPoolCreated == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 4:
              return {
                ...v,
                Status:
                  testnetUser.data?.concavePoolCreated == true ||
                  ropstenProgress.concavePoolCreated == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 5:
              return {
                ...v,
                Status:
                  testnetUser.data?.liquidityAdded == true ||
                  ropstenProgress.liquidityAdded == 'True'
                    ? 'Completed'
                    : 'Open',
              }

            case 6:
              return {
                ...v,
                Status:
                  testnetUser.data?.liquidityRemoved == true ||
                  ropstenProgress.liquidityRemoved == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 7:
              return {
                ...v,
                Status:
                  testnetUser.data?.buyLimitOrderCreatedAndFilled == true ||
                  ropstenProgress.buyLimitOrderCreatedAndFilled == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 8:
              return {
                ...v,
                Status:
                  testnetUser.data?.sellLimitOrderCreatedAndFilled == true ||
                  ropstenProgress.sellLimitOrderCreatedAndFilled == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 9:
              return {
                ...v,
                Status:
                  testnetUser.data?.buyLimitOrderFilled == true ||
                  ropstenProgress.buyLimitOrderFilled == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 10:
              return {
                ...v,
                Status:
                  testnetUser.data?.sellLimitOrderFilled == true ||
                  ropstenProgress.sellLimitOrderFilled == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 11:
              return {
                ...v,
                Status:
                  testnetUser.data?.finalValueReported == true ||
                  ropstenProgress.finalValueReported == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 12:
              return {
                ...v,
                Status:
                  testnetUser.data?.reportedValueChallenged == true ||
                  ropstenProgress.reportedValueChallenged == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 13:
              return {
                ...v,
                Status:
                  testnetUser.data?.positionTokenRedeemed == true ||
                  ropstenProgress.positionTokenRedeemed == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 14:
              return {
                ...v,
                Status:
                  testnetUser.data?.feesClaimed == true ||
                  ropstenProgress.feesClaimed == 'True'
                    ? 'Completed'
                    : 'Open',
              }
            case 15:
              return {
                ...v,
                Status:
                  testnetUser.data?.feeClaimsTransferred == true ||
                  ropstenProgress.feeClaimsTransferred == 'True'
                    ? 'Completed'
                    : 'Open',
              }
          }
        })
      )
    }
  }, [ropstenProgress, testnetUser.isSuccess, userAddress])

  useEffect(() => {
    calcRows.map((row) => {
      if (row.Status === 'Completed') {
        score = score + 200
      }
    })
    setPoints(score)
    if (points === 3000) {
      setMultiplier('1.5')
    }
  }, [ropstenProgress, userAddress, calcRows, multiplier, points === 3000])
  return (
    <Box>
      <Box
        paddingX={6}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <TaskIcon style={{ fontSize: 34, padding: 20, paddingRight: 10 }} />
        <h2> Testnet Tasks</h2>
      </Box>
      <Stack
        sx={{ pb: theme.spacing(5), justifyContent: 'space-between' }}
        direction={mobile ? 'column' : 'row'}
        height="80%"
        width="90%"
      >
        {!mobile && (
          <Container
            sx={{
              width: theme.spacing(mobile ? 40 : 99),
              marginLeft: theme.spacing(mobile ? 0 : 5),
            }}
          >
            <DataGrid
              sx={{ width: '100%', border: 0 }}
              hideFooter={true}
              autoHeight={true}
              disableColumnMenu={true}
              disableSelectionOnClick={true}
              className={classes.root}
              rows={calcRows}
              columns={columns}
            />
          </Container>
        )}

        <Stack
          spacing={theme.spacing(6)}
          sx={{ paddingLeft: theme.spacing(2) }}
        >
          <Box
            sx={{ mb: theme.spacing(-17), border: 1, borderColor: '#2A2A2D' }}
            width={mobile ? '100%' : theme.spacing(65)}
            height={theme.spacing(30)}
            style={{
              background: '#171718',
            }}
          >
            <Container sx={{ pt: theme.spacing(2) }}>
              {userAddress != null ? (
                <>
                  <Typography sx={{ pb: theme.spacing(2) }}>
                    Your progress
                  </Typography>
                  <NumberLinearProgress
                    variant={'determinate'}
                    value={Math.round((points / 3000) * 100)}
                  />
                </>
              ) : (
                <Typography
                  sx={{ pl: theme.spacing(12), pt: theme.spacing(6) }}
                >
                  Please connect your wallet
                </Typography>
              )}
            </Container>
          </Box>
          <Box
            sx={{ border: 1, borderColor: '#2A2A2D' }}
            style={{
              background: 'linear-gradient(to bottom, #050539, #0D0D11)',
            }}
            width={mobile ? '100%' : theme.spacing(65)}
            height={theme.spacing(30)}
          >
            <Container sx={{ mr: theme.spacing(15), pt: theme.spacing(5) }}>
              <Container>
                <Typography
                  fontSize={'1.2em'}
                  color={'white'}
                  sx={{ pb: theme.spacing(5) }}
                >
                  Your rewards
                </Typography>
              </Container>
              <Stack
                direction={'row'}
                sx={{ justifyContent: mobile ? 'center' : 'space-between' }}
              >
                <Container>
                  <Typography>Current points</Typography>
                  {userAddress != null ? (
                    <Typography fontSize={'1.7em'} color={'white'}>
                      {points}
                    </Typography>
                  ) : (
                    <Typography>-</Typography>
                  )}
                </Container>
                <Container>
                  <Typography>Multiplier</Typography>
                  {userAddress != null ? (
                    <Typography fontSize={'1.7em'} color={'white'}>
                      {multiplier}x
                    </Typography>
                  ) : (
                    <Typography>-</Typography>
                  )}
                </Container>
                <Container>
                  <Typography>Total points</Typography>
                  {userAddress != null ? (
                    <Typography fontSize={'1.7em'} color={'white'}>
                      {points * parseFloat(multiplier)}
                    </Typography>
                  ) : (
                    <Typography>-</Typography>
                  )}
                </Container>
              </Stack>
            </Container>
          </Box>
          {mobile && (
            <DataGrid
              sx={{
                width: mobile ? '100%' : theme.spacing(99),
                border: 0,
              }}
              hideFooter={true}
              autoHeight={true}
              disableColumnMenu={true}
              disableSelectionOnClick={true}
              className={classes.root}
              rows={calcRows}
              columns={columns}
            />
          )}
          <Box
            style={{
              background: '#171718',
            }}
            sx={{ border: 1, borderColor: '#2A2A2D' }}
            width={mobile ? '100%' : theme.spacing(65)}
            height={theme.spacing(mobile ? 40 : 30)}
          >
            <Container sx={{ pt: theme.spacing(5) }}>
              <Stack
                spacing={theme.spacing(2)}
                sx={{ justifyContent: 'space-between' }}
              >
                <Stack spacing={theme.spacing(2)} direction={'row'}>
                  <Typography color={'white'}>1.5x</Typography>
                  <Typography>
                    Multiplier on points collected if you complete all tasks
                  </Typography>
                </Stack>
                <Stack
                  spacing={theme.spacing(2)}
                  direction={'row'}
                  sx={{ justifyContent: 'space-between' }}
                >
                  <Typography color={'white'}>3.0x</Typography>
                  <Typography>
                    Multiplier on points collected if you complete all tasks AND
                    hold an{' '}
                    <Link
                      href="https://opensea.io/collection/888whales"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      888Whales NFT
                    </Link>{' '}
                    at the end of the testnet
                  </Typography>
                </Stack>
                <Stack spacing={theme.spacing(3)} direction={'row'}>
                  <DateRangeIcon sx={{ color: 'white' }} />
                  <Typography>
                    You can complete all tasks until
                    <Typography fontWeight="bold" display="inline">
                      {' '}
                      30th September 2022
                    </Typography>
                  </Typography>
                </Stack>
              </Stack>
            </Container>
          </Box>
          <Box
            sx={{ border: 1, borderColor: '#2A2A2D' }}
            style={{
              background: 'linear-gradient(to bottom, #191935, #0D0D11)',
            }}
          >
            <Container sx={{ pt: theme.spacing(1), pb: theme.spacing(1) }}>
              <Stack direction={'row'}>
                <CampaignIcon fontSize={'large'} color={'primary'} />
                <Container>
                  <Typography>Feedback? Bug reports?</Typography>
                  <Typography>
                    Let us know in our{' '}
                    <Link
                      href="https://discord.gg/NJDm29eEa4"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      discord
                    </Link>{' '}
                    channel
                  </Typography>
                </Container>
              </Stack>
            </Container>
          </Box>
        </Stack>
      </Stack>
    </Box>
  )
}
