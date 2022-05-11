import { Box, Card, Container, Stack, useTheme } from '@mui/material'
import Typography from '@mui/material/Typography'
import React from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
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
  const [value, setValue] = React.useState(0)

  const theme = useTheme()

  const handleChange = (event: any, newValue: any) => {
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
          <Tabs value={value} onChange={handleChange} variant="fullWidth">
            <Tab label="Add" />
            <Tab label="Remove" />
          </Tabs>
          {value ? (
            <RemoveLiquidity pool={pool!} />
          ) : (
            <AddLiquidity pool={pool!} />
          )}
        </Container>
        {!value && pool && (
          <Container sx={{ mt: theme.spacing(4), mb: theme.spacing(4) }}>
            {pool &&
            formatUnits(pool.capacity, pool.collateralToken.decimals) !==
              '0.0' ? (
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
                        : formatUnits(
                            pool.capacity,
                            pool.collateralToken.decimals
                          ))}{' '}
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
                      ) +
                        ' / ' +
                        parseFloat(
                          formatUnits(
                            BigNumber.from(pool.capacity),
                            pool.collateralToken.decimals
                          )
                        )}{' '}
                    {pool.collateralToken.symbol!}{' '}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Currently Utilized</Typography>
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
                    {'% '}
                    {pool.collateralToken.symbol!}{' '}
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
        {value ? (
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
