import { Box, Card, Container, Stack, useTheme } from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useState } from 'react'
import { useParams } from 'react-router'
import { useHistory } from 'react-router-dom'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { AddLiquidity } from './AddLiquidity'
import { BigNumber } from 'ethers'
import { RemoveLiquidity } from './RemoveLiquidity'
import { formatUnits } from 'ethers/lib/utils'
import { ReactComponent as Bullish } from '../../Images/bullish-svgrepo-com.svg'
import { ReactComponent as Bearish } from '../../Images/bearish-svgrepo-com.svg'
import { ReactComponent as Star } from '../../Images/star-svgrepo-com.svg'
type Props = {
  pool?: any
}
export const Liquidity = ({ pool }: Props) => {
  const history = useHistory()
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'
  const currentTab =
    history.location.pathname ===
    `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity/remove`
      ? 'remove'
      : 'add'
  console.log('History path is:', history.location.pathname)
  const [value, setValue] = React.useState(currentTab)

  const theme = useTheme()

  const handleChange = (event: any, newValue: string) => {
    history.push(
      `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity/` + newValue
    )
    setValue(newValue)
  }
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack
        direction={'column'}
        sx={{
          paddingTop: theme.spacing(3),
          minWidth: theme.spacing(82),
        }}
      >
        <Container sx={{ borderRadius: '16px' }}>
          <TabContext value={value}>
            <TabList onChange={handleChange} variant="fullWidth">
              <Tab value="add" label="Add" />
              <Tab value="remove" label="Remove" />
            </TabList>
            <TabPanel value="add">
              <AddLiquidity pool={pool!} />
            </TabPanel>
            <TabPanel value="remove">
              <RemoveLiquidity pool={pool!} />
            </TabPanel>
          </TabContext>
        </Container>
        {currentTab == 'add' && pool && (
          <Container sx={{ mt: theme.spacing(4), mb: theme.spacing(4) }}>
            {pool &&
            formatUnits(pool.capacity, pool.collateralToken.decimals) ==
              '0.0' &&
            pool.capacity.toString() !==
              '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? (
              <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(4) }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool Capacity</Typography>
                  <Typography>
                    {pool &&
                      (formatUnits(
                        pool.capacity,
                        pool.collateralToken.decimals
                      ) === '0.0'
                        ? 'Unlimited'
                        : parseFloat(
                            formatUnits(
                              pool.capacity,
                              pool.collateralToken.decimals
                            )
                          ).toFixed(2))}{' '}
                    {pool.collateralToken.symbol}{' '}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Currently Utilized</Typography>
                  <Typography>
                    {pool &&
                      parseFloat(
                        formatUnits(
                          BigNumber.from(pool.collateralBalance),
                          pool.collateralToken.decimals
                        )
                      ).toFixed(2)}{' '}
                    {pool.collateralToken.symbol!}{' '}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Currently Utilized in %</Typography>
                  <Typography>
                    {pool &&
                      (
                        (100 *
                          parseFloat(
                            formatUnits(
                              BigNumber.from(pool.collateralBalance),
                              pool.collateralToken.decimals
                            )
                          )) /
                        parseFloat(
                          formatUnits(
                            BigNumber.from(pool.capacity),
                            pool.collateralToken.decimals
                          )
                        )
                      ).toFixed(2)}
                    {'%'}
                  </Typography>
                </Stack>
              </Container>
            ) : (
              <Container>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool Capacity</Typography>
                  <Typography>Unlimited</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Current Pool Size</Typography>
                  <Typography>
                    {pool &&
                      parseFloat(
                        formatUnits(
                          BigNumber.from(pool.collateralBalance),
                          pool.collateralToken.decimals
                        )
                      ).toFixed(4)}{' '}
                    {pool.collateralToken.symbol!}{' '}
                  </Typography>
                </Stack>
              </Container>
            )}
          </Container>
        )}
        {currentTab == 'remove' ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: theme.spacing(82),
            }}
          >
            <Card
              sx={{
                mt: theme.spacing(2),
                borderRadius: '16px',
                width: '450px',
              }}
            >
              <Container
                sx={{
                  mt: theme.spacing(2),
                  mb: theme.spacing(2),
                }}
              >
                <Stack direction="row">
                  <Star
                    style={{
                      marginTop: theme.spacing(-1),
                      paddingRight: theme.spacing(1),
                      height: theme.spacing(4),
                      width: theme.spacing(4),
                    }}
                  />
                  <Typography fontSize={'0.85rem'} style={{ color: 'gray' }}>
                    {' '}
                    By removing liquidity you are giving back long and short
                    position tokens proportional to the pool balance and receive
                    collateral in return
                  </Typography>
                </Stack>
              </Container>
            </Card>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: theme.spacing(82),
              mb: theme.spacing(4),
            }}
          >
            <Card
              sx={{
                width: '450px',
                borderRadius: '16px',
              }}
            >
              <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
                <Stack direction="column">
                  <Stack direction="row">
                    <Star
                      style={{
                        marginTop: theme.spacing(-1),
                        paddingRight: theme.spacing(1.8),
                        height: theme.spacing(4),
                        width: theme.spacing(4),
                      }}
                    />
                    <Typography fontSize={'0.85rem'} style={{ color: 'gray' }}>
                      {'    '}
                      By adding liquidity you receive long and short position
                      tokens in return which represent a claim against the
                      collateral you deposited
                    </Typography>
                  </Stack>
                  <Stack direction="row">
                    <Bullish
                      style={{
                        paddingTop: theme.spacing(2),
                        paddingRight: theme.spacing(1),
                        height: theme.spacing(2.5),
                        width: theme.spacing(2.5),
                      }}
                    />
                    <Typography
                      fontSize={'0.85rem'}
                      sx={{ mt: theme.spacing(2) }}
                      style={{ color: 'gray' }}
                    >
                      {' '}
                      Bullish? Keep the long tokens and sell the short tokens
                    </Typography>
                  </Stack>
                  <Stack direction="row">
                    <Bearish
                      style={{
                        paddingTop: theme.spacing(2),
                        paddingRight: theme.spacing(1),
                        height: theme.spacing(2.5),
                        width: theme.spacing(2.5),
                      }}
                    />
                    <Typography
                      fontSize={'0.85rem'}
                      sx={{ mt: theme.spacing(2) }}
                      style={{ color: 'gray' }}
                    >
                      {' '}
                      Bearish? Keep the short tokens and sell the long tokens
                    </Typography>
                  </Stack>
                </Stack>
              </Container>
            </Card>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
