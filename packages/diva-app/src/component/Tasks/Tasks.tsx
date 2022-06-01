import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import { useStyles, WhiteText } from '../Trade/Orders/UiStyles'
import {
  Box,
  Container,
  LinearProgress,
  Stack,
  Link,
  Typography,
  useTheme,
} from '@mui/material'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import DateRangeIcon from '@mui/icons-material/DateRange'
import CampaignIcon from '@mui/icons-material/Campaign'
import { ethers, BigNumber } from 'ethers'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useAppSelector } from '../../Redux/hooks'
import { selectPools, selectUserAddress } from '../../Redux/appSlice'
import IZeroX_ABI from '../../abi/IZeroX.json'
import { useQuery } from 'react-query'
import {
  OrderFill,
  queryOrderFills,
  queryOrderFillsMaker,
  queryTestUser,
  TestUser,
} from '../../lib/queries'
import request from 'graphql-request'
const columns: GridColDef[] = [
  {
    field: 'Task',
    align: 'left',
    minWidth: 350,
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
    Task: 'Create a pool with a convex payoff',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 4,
    Task: 'Create a pool with a concave payoff',
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
    Task: 'Fill an existing order via SELL MARKET',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 10,
    Task: 'Fill an existing order via BUY MARKET',
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
      <Box mr={1}>
        <LinearProgress variant="determinate" value={props.value} />
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
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const pools = useAppSelector((state) => selectPools(state))
  const myPools = pools.filter(
    (pool) => pool.createdBy?.toLowerCase() === userAddress?.toLowerCase()
  )
  const calcStatuses = rows
  const [calcRows, setCalcRows] = useState(rows)
  const [binary, setBinary] = useState('Open')
  const [linear, setLinear] = useState('Open')
  const [convex, setConvex] = useState('Open')
  const [concave, setConcave] = useState('Open')
  const [points, setPoints] = useState(0)
  const [addLiquidity, setAddLiquidity] = useState('Open')
  const [removeLiquidity, setRemoveLiquidity] = useState('Open')
  const [challenged, setChallenged] = useState('Open')
  const [reported, setReported] = useState('Open')
  const [feeTrasfered, setFeeTransfered] = useState('Open')
  const [claimFees, setClaimFees] = useState('Open')
  const [buyLimit, setBuyLimit] = useState('Open')
  const [buyLimitFilled, setBuyLimitFilled] = useState('Open')
  const [sellLimit, setSellLimit] = useState('Open')
  const [sellLimitFilled, setSellLimitFilled] = useState('Open')
  const [redeemed, setRedeemed] = useState('Open')
  const [multiplier, setMultiplier] = useState('1.0')
  let score = 0
  //  setBuyLimitFilled
  const myPositionTokens: string[] = []
  const testnetUser = useQuery<TestUser>('testnetUser', async () => {
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
  })
  const orderFills = useQuery<OrderFill[]>('orderFills', async () => {
    const response = request(
      config[chainId].zeroxSubgraph,
      queryOrderFills(userAddress)
    ).then((orders) => {
      if (orders.nativeOrderFills != null) {
        return orders.nativeOrderFills
      } else {
        return {}
      }
    })
    return response
  })
  const orderFillsMaker = useQuery<OrderFill[]>('orderFillsMaker', async () => {
    const response = request(
      config[chainId].zeroxSubgraph,
      queryOrderFillsMaker(userAddress)
    ).then((orders) => {
      if (orders.nativeOrderFills != null) {
        return orders.nativeOrderFills
      } else {
        return {}
      }
    })
    return response
  })
  useEffect(() => {
    if (
      pools != null &&
      orderFills.data != null &&
      orderFillsMaker.data != null &&
      testnetUser.data != null &&
      userAddress != null
    ) {
      pools.map((pool) => {
        myPositionTokens.push(pool.longToken.id.toLowerCase())
        myPositionTokens.push(pool.shortToken.id.toLowerCase())
      })

      orderFillsMaker.data.map((order) => {
        if (myPositionTokens.includes(order.takerToken.toLowerCase())) {
          setBuyLimit('Completed')
        } else if (myPositionTokens.includes(order.makerToken.toLowerCase())) {
          setSellLimit('Completed')
        }
      })

      orderFills.data.map((order) => {
        if (myPositionTokens.includes(order.takerToken.toLowerCase())) {
          setBuyLimitFilled('Completed')
        } else if (myPositionTokens.includes(order.makerToken.toLowerCase())) {
          setSellLimitFilled('Completed')
        }
      })
      setCalcRows(
        rows.map((v) => {
          switch (v.id) {
            case 1:
              return {
                ...v,
                Status:
                  testnetUser.data?.binaryPoolCreated == true
                    ? 'Completed'
                    : 'Open',
              }
            case 2:
              return {
                ...v,
                Status:
                  testnetUser.data?.linearPoolCreated == true
                    ? 'Completed'
                    : 'Open',
              }
            case 3:
              return {
                ...v,
                Status:
                  testnetUser.data?.convexPoolCreated == true
                    ? 'Completed'
                    : 'Open',
              }
            case 4:
              return {
                ...v,
                Status:
                  testnetUser.data?.concavePoolCreated == true
                    ? 'Completed'
                    : 'Open',
              }
            case 5:
              return {
                ...v,
                Status:
                  testnetUser.data?.liquidityAdded == true
                    ? 'Completed'
                    : 'Open',
              }

            case 6:
              return {
                ...v,
                Status:
                  testnetUser.data?.liquidityRemoved == true
                    ? 'Completed'
                    : 'Open',
              }
            case 7:
              return {
                ...v,
                Status: buyLimit,
              }
            case 8:
              return {
                ...v,
                Status: sellLimit,
              }
            case 9:
              return {
                ...v,
                Status: buyLimitFilled,
              }
            case 10:
              return {
                ...v,
                Status: sellLimitFilled,
              }
            case 11:
              return {
                ...v,
                Status:
                  testnetUser.data?.finalValueReported == true
                    ? 'Completed'
                    : 'Open',
              }
            case 12:
              return {
                ...v,
                Status:
                  testnetUser.data?.reportedValueChallenged == true
                    ? 'Completed'
                    : 'Open',
              }
            case 13:
              return {
                ...v,
                Status:
                  testnetUser.data?.positionTokenRedeemed == true
                    ? 'Completed'
                    : 'Open',
              }
            case 14:
              return {
                ...v,
                Status:
                  testnetUser.data?.feesClaimed == true ? 'Completed' : 'Open',
              }
            case 15:
              return {
                ...v,
                Status:
                  testnetUser.data?.feeClaimsTransferred == true
                    ? 'Completed'
                    : 'Open',
              }
          }
        })
      )
    }
  }, [
    testnetUser.isSuccess,
    orderFillsMaker.isSuccess,
    orderFills.isSuccess,
    userAddress,
    myPositionTokens != null,
    buyLimitFilled,
    buyLimit,
    sellLimitFilled,
    sellLimit,
  ])

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
  }, [calcRows, multiplier, points === 3000])
  return (
    <Stack
      sx={{ justifyContent: 'space-between' }}
      direction={'row'}
      height="80%"
      width="90%"
    >
      <Container sx={{ paddingRight: theme.spacing(40) }}>
        <h3>DIVA testnet tasks</h3>
        <DataGrid
          sx={{ border: 0 }}
          hideFooter={true}
          autoHeight={true}
          disableColumnMenu={true}
          disableSelectionOnClick={true}
          className={classes.root}
          rows={calcRows}
          columns={columns}
        />
      </Container>

      <Stack spacing={theme.spacing(6)} sx={{ paddingLeft: theme.spacing(40) }}>
        <Box
          sx={{ mb: theme.spacing(-17), border: 1, borderColor: '#2A2A2D' }}
          width={theme.spacing(65)}
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
              <Typography sx={{ pl: theme.spacing(12), pt: theme.spacing(6) }}>
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
          width={theme.spacing(65)}
          height={theme.spacing(30)}
        >
          <Container sx={{ pt: theme.spacing(5) }}>
            <Container>
              <Typography sx={{ pb: theme.spacing(2) }}>
                Your rewards
              </Typography>
            </Container>
            <Stack direction={'row'} sx={{ justifyContent: 'space-between' }}>
              <Container>
                <Typography>Current points</Typography>
                {userAddress != null ? (
                  <Typography>{points}</Typography>
                ) : (
                  <Typography>-</Typography>
                )}
              </Container>
              <Container>
                <Typography>Multiplier</Typography>
                {userAddress != null ? (
                  <Typography>{multiplier}x</Typography>
                ) : (
                  <Typography>-</Typography>
                )}
              </Container>
              <Container>
                <Typography>Total points</Typography>
                {userAddress != null ? (
                  <Typography>{points * parseFloat(multiplier)}</Typography>
                ) : (
                  <Typography>-</Typography>
                )}
              </Container>
            </Stack>
          </Container>
        </Box>
        <Box
          style={{
            background: '#171718',
          }}
          sx={{ border: 1, borderColor: '#2A2A2D' }}
          width={theme.spacing(65)}
          height={theme.spacing(30)}
        >
          <Container sx={{ pt: theme.spacing(5) }}>
            <Stack
              spacing={theme.spacing(2)}
              sx={{ justifyContent: 'space-between' }}
            >
              <Stack spacing={theme.spacing(2)} direction={'row'}>
                <Typography>1.5x</Typography>
                <Typography>
                  Multiplier on points collected if you complete all tasks
                </Typography>
              </Stack>
              <Stack
                spacing={theme.spacing(2)}
                direction={'row'}
                sx={{ justifyContent: 'space-between' }}
              >
                <Typography>3.0x</Typography>
                <Typography>
                  Multiplier on points collected if you complete all tasks AND
                  hold an{' '}
                  <Link
                    href="https://opensea.io/collection/888whales/activity"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    888Whales NFT
                  </Link>{' '}
                  at DIVA token launch
                </Typography>
              </Stack>
              <Stack spacing={theme.spacing(3)} direction={'row'}>
                <DateRangeIcon />
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
              <CampaignIcon fontSize={'large'} />
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
  )
}
