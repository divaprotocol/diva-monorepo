import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import React, { useEffect, useState } from 'react'
import { useStyles } from '../Trade/Orders/UiStyles'
import {
  Box,
  Container,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import DateRangeIcon from '@mui/icons-material/DateRange'
import CampaignIcon from '@mui/icons-material/Campaign'
import { ethers, BigNumber } from 'ethers'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useAppSelector } from '../../Redux/hooks'
import { selectPools, selectUserAddress } from '../../Redux/appSlice'
import IZeroX_ABI from '../../abi/IZeroX.json'
import { CollateralTokenEntity } from '../../lib/queries'

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
    Task: 'Create a BUY LIMIT order',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 8,
    Task: 'Create a SELL LIMIT order',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 9,
    Task: 'Fill a BUY LIMIT order',
    Points: 200,
    Status: 'Unknown',
  },
  {
    id: 10,
    Task: 'Fill a SELL LIMIT order',
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
  let binary = 'Open'
  let linear = 'Open'
  let concave = 'Open'
  let convex = 'Open'
  const [points, setPoints] = useState(0)
  const [addLiquidity, setAddLiquidity] = useState('Open')
  const [removeLiquidity, setRemoveLiquidity] = useState('Open')
  const [challenged, setChallenged] = useState('Open')
  const [reported, setReported] = useState('Open')
  const [feeTrasfered, setFeeTransfered] = useState('Open')
  const [claimFees, setClaimFees] = useState('Open')
  const [buyLimit, setBuyLimitFill] = useState('Open')
  const [buyLimitFilled, setBuyLimitFilled] = useState('Open')
  const [sellLimit, setSellLimitFill] = useState('Open')
  const [sellLimitFilled, setSellLimitFilled] = useState('Open')
  const [multiplier, setMultiplier] = useState(1)
  //  setBuyLimitFilled
  const myPositionTokens: string[] = []
  let newPoints = 0
  useEffect(() => {
    if (
      myPools != null &&
      chainId != null &&
      userAddress != null &&
      provider != null
    ) {
      myPools.map((pool) => {
        myPositionTokens.push(pool.longToken.id.toLowerCase())
        myPositionTokens.push(pool.shortToken.id.toLowerCase())
      })
      const diva = new ethers.Contract(
        config[chainId].divaAddress,
        DIVA_ABI,
        provider?.getSigner()
      )
      const zeroX = new ethers.Contract(
        config[chainId].zeroXAddress,
        IZeroX_ABI,
        provider?.getSigner()
      )
      myPools.map((pool) => {
        const floor = BigNumber.from(pool.floor)
        const inflection = BigNumber.from(pool.inflection)
        const cap = BigNumber.from(pool.cap)
        const collateralBalanceLongInitial = BigNumber.from(
          pool.collateralBalanceLongInitial
        )
        const collateralBalanceShortInitial = BigNumber.from(
          pool.collateralBalanceShortInitial
        )
        const collateralUnit = parseUnits('1', pool.collateralToken.decimals)
        const scaling = parseUnits('1', 18 - pool.collateralToken.decimals)

        if (cap.eq(inflection) && inflection.eq(floor) && binary !== 'Closed') {
          binary = 'Closed'
        }
        if (floor.lt(inflection) && inflection.lt(cap)) {
          if (
            collateralBalanceLongInitial.eq(collateralBalanceShortInitial) &&
            linear !== 'Closed'
          ) {
            linear = 'Closed'
          }
          if (
            // concave: long payout at inflection > imaginary linear line
            collateralBalanceLongInitial
              .mul(collateralUnit)
              .div(
                collateralBalanceLongInitial.add(collateralBalanceShortInitial)
              )
              .mul(scaling)
              .gt(
                inflection.sub(floor).mul(parseEther('1')).div(cap.sub(floor))
              ) &&
            concave !== 'Closed'
          ) {
            concave = 'Closed'
          }
          if (
            // convex: long payout at inflection < imaginary linear line
            collateralBalanceLongInitial
              .mul(collateralUnit)
              .div(
                collateralBalanceLongInitial.add(collateralBalanceShortInitial)
              )
              .mul(scaling)
              .lt(
                inflection.sub(floor).mul(parseEther('1')).div(cap.sub(floor))
              ) &&
            convex !== 'Closed'
          ) {
            convex = 'Closed'
          }
        }
      })
      if (zeroX) {
        const orderFilled = {
          address: zeroX.address,
          fromBlock: config[chainId].fromBlock,
          topics: [
            ethers.utils.id(
              'LimitOrderFilled(bytes32,address,address,address,address,address,uint128,uint128,uint128,uint256,bytes32)'
            ),
          ],
        }
        zeroX
          .queryFilter(orderFilled, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              const orderData = ethers.utils.defaultAbiCoder.decode(
                [
                  'bytes32',
                  'address',
                  'address',
                  'address',
                  'address',
                  'address',
                  'uint128',
                  'uint128',
                  'uint128',
                  'uint256',
                  'bytes32',
                ],
                event.data
              )
              if (orderData[1].toLowerCase() === userAddress.toLowerCase()) {
                if (
                  myPositionTokens.includes(orderData[5].toLowerCase()) &&
                  buyLimit !== 'Closed'
                ) {
                  setBuyLimitFill('Closed')
                } else if (
                  myPositionTokens.includes(orderData[4].toLowerCase()) &&
                  sellLimit !== 'Closed'
                ) {
                  setSellLimitFill('Closed')
                }
              } else if (
                orderData[2].toLowerCase() === userAddress.toLowerCase()
              ) {
                if (
                  myPositionTokens.includes(orderData[5].toLowerCase()) &&
                  buyLimitFilled !== 'Closed'
                ) {
                  setBuyLimitFilled('Closed')
                } else if (
                  myPositionTokens.includes(orderData[4].toLowerCase()) &&
                  sellLimitFilled !== 'Closed'
                ) {
                  setSellLimitFilled('Closed')
                }
              }
            })
          })
      }
      if (diva) {
        const LiquidityAdded = {
          address: diva.address,
          topics: [ethers.utils.id('LiquidityAdded(uint256,address,uint256)')],
        }
        const LiquidityRemoved = {
          address: diva.address,
          topics: [
            ethers.utils.id('LiquidityRemoved(uint256,address,uint256)'),
          ],
        }
        const statusChanged = {
          address: diva.address,
          topics: [
            ethers.utils.id('StatusChanged(uint8,address,uint256,uint256)'),
          ],
        }
        const FeeClaimTransferred = {
          address: diva.address,
          topics: [
            ethers.utils.id(
              'FeeClaimTransferred(address,address,address,uint256)'
            ),
          ],
        }
        const FeeClaimAllocated = {
          address: diva.address,
          topics: [
            ethers.utils.id('FeeClaimAllocated(uint256,address,uint256)'),
          ],
        }
        const Transfer = {
          address: diva.address,
          topics: [ethers.utils.id('Transfer(address,address,uint256)')],
        }
        diva
          .queryFilter(FeeClaimAllocated, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              if (event.args[1].toLowerCase() === userAddress.toLowerCase()) {
                setClaimFees('Closed')
              }
            })
          })
        diva
          .queryFilter(FeeClaimTransferred, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              if (event.args[1].toLowerCase() === userAddress.toLowerCase()) {
                setFeeTransfered('Closed')
              }
            })
          })
        diva
          .queryFilter(statusChanged, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              if (event.args[1].toLowerCase() === userAddress.toLowerCase()) {
                switch (event.args.statusFinalReferenceValue) {
                  case 1:
                    setReported('Closed')
                    break

                  case 2:
                    setChallenged('Closed')
                    break
                }
              }
            })
          })
        diva
          .queryFilter(LiquidityAdded, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              if (event.args[1].toLowerCase() === userAddress.toLowerCase()) {
                setAddLiquidity('Closed')
              }
            })
          })
        diva
          .queryFilter(LiquidityRemoved, config[chainId].fromBlock)
          .then((data) => {
            data.map((event) => {
              if (event.args[1].toLowerCase() === userAddress.toLowerCase()) {
                setRemoveLiquidity('Closed')
              }
            })
          })
      }
      setCalcRows(
        rows.map((v) => {
          switch (v.id) {
            case 1:
              return {
                ...v,
                Status: binary,
              }
            case 2:
              return {
                ...v,
                Status: linear,
              }
            case 3:
              return {
                ...v,
                Status: convex,
              }
            case 4:
              return {
                ...v,
                Status: concave,
              }
            case 5:
              return {
                ...v,
                Status: addLiquidity,
              }

            case 6:
              return {
                ...v,
                Status: removeLiquidity,
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
                Status: challenged,
              }
            case 12:
              return {
                ...v,
                Status: reported,
              }
            case 13:
              return {
                ...v,
                Status: 'Not Working',
              }
            case 14:
              return {
                ...v,
                Status: claimFees,
              }
            case 15:
              return {
                ...v,
                Status: feeTrasfered,
              }
          }
        })
      )
    }
    calcRows.map((row) => {
      if (row.Status === 'Closed') {
        newPoints = newPoints + 200
      }
    })
    setPoints(newPoints)
    if (points === 3000) {
      setMultiplier(1.5)
    }
  }, [
    chainId,
    userAddress,
    provider,
    claimFees,
    points,
    addLiquidity,
    removeLiquidity,
    feeTrasfered,
    reported,
    challenged,
    buyLimit,
    buyLimitFilled,
    sellLimit,
    sellLimitFilled,
  ])
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
          width={theme.spacing(55)}
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
                <LinearProgress
                  variant={'determinate'}
                  value={(points / 3000) * 100}
                />
                <Stack
                  direction={'row'}
                  sx={{ justifyContent: 'space-between' }}
                >
                  <Typography>0%</Typography>
                  <Typography>100%</Typography>
                </Stack>
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
          width={theme.spacing(55)}
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
                  <Typography>{multiplier}</Typography>
                ) : (
                  <Typography>-</Typography>
                )}
              </Container>
              <Container>
                <Typography>Total points</Typography>
                {userAddress != null ? (
                  <Typography>{points * multiplier}</Typography>
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
          width={theme.spacing(55)}
          height={theme.spacing(30)}
        >
          <Container sx={{ pt: theme.spacing(5) }}>
            <Stack
              spacing={theme.spacing(2)}
              sx={{ justifyContent: 'space-between' }}
            >
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
              <Stack spacing={theme.spacing(3)} direction={'row'}>
                <DateRangeIcon />
                <Typography>
                  You can complete all tasks until 30th September 2022
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
                <Typography>Let us know in our discord channel</Typography>
              </Container>
            </Stack>
          </Container>
        </Box>
      </Stack>
    </Stack>
  )
}
