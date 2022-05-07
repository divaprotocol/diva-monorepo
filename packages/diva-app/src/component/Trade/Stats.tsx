import { Divider, Paper, Stack, Typography, useTheme } from '@mui/material'
import { Pool } from '../../lib/queries'
import { selectIsBuy } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import TradeChart from '../Graphs/TradeChart'

export default function Stats(props: {
  pool: Pool
  data: any
  chainId: number
  OptionParams: any
}) {
  const breakEvenOptionPrice = 0
  const theme = useTheme()
  const isBuy = useAppSelector((state) => selectIsBuy(state))
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const intrinsicValue = useAppSelector((state) => state.stats.intrinsicValue)
  const maxYield = useAppSelector((state) => state.stats.maxYield)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  return (
    <>
      <Paper>
        <TradeChart
          data={props.data}
          refAsset={props.pool.referenceAsset}
          payOut={props.pool.collateralToken.symbol}
          w={380}
          h={200}
          isLong={props.OptionParams.IsLong}
          breakEven={breakEvenOptionPrice}
        />
      </Paper>
      <Typography
        sx={{
          paddingLeft: theme.spacing(3),
          mt: theme.spacing(1),
        }}
      >
        Buyers statistics:
      </Typography>
      <Divider />
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
          Max yield
        </Typography>
        {isBuy ? (
          <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
            {maxYield}
          </Typography>
        ) : (
          <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
            {maxYield}
          </Typography>
        )}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
          Break-even
        </Typography>
        <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
          {breakEven}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
          Intrinsic value per token
        </Typography>
        <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
          {parseFloat(intrinsicValue).toFixed(2)}
        </Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
          Max payout per token
        </Typography>
        <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
          {maxPayout}
        </Typography>
      </Stack>
    </>
  )
}
