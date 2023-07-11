import { Divider, Stack, Box, Typography, Grid } from '@mui/material'
import { GridRowModel } from '@mui/x-data-grid'
import { GreenText, RedText } from '../Trade/Orders/UiStyles'

export const TradeHistoryTabTokenCars = ({ row }: { row: GridRowModel }) => {
  const { Underlying, AssetId, type, quantity, price, payReceive, timestamp } =
    row

  const DATA_ARRAY = [
    {
      label: 'Type',
      value: type,
    },
    {
      label: 'Quantity',
      value: quantity,
    },
    {
      label: 'Price',
      value: price,
    },
    {
      label: 'Pay/Receive',
      value: payReceive,
    },
  ]

  return (
    <>
      <Divider light />
      <Stack
        sx={{
          fontSize: '10px',
          width: '100%',
          margin: '12px 0',
        }}
        spacing={1.6}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gridGap: '8px',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {Underlying}
            </Typography>
            <Typography
              sx={{
                fontSize: '9.2px',
              }}
            >
              #{AssetId}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.6} alignItems="center">
            <Typography
              sx={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#828282',
              }}
            >
              Timestamp
            </Typography>
            <Typography
              sx={{
                fontSize: '10px',
              }}
            >
              {timestamp}
            </Typography>
          </Stack>
        </Box>
        <Grid
          container
          rowGap={1.6}
          justifyContent="space-between"
          columnGap={'3px'}
        >
          {DATA_ARRAY.map(({ label, value }, index) => (
            <Grid item key={index} xs={5}>
              <Stack direction="row" justifyContent={'space-between'}>
                <Box
                  sx={{
                    color: '#828282',
                  }}
                >
                  {label}
                </Box>
                {label === 'Type' ? (
                  <>
                    {value === 'BUY' ? (
                      <GreenText>{value}</GreenText>
                    ) : (
                      <RedText>{value}</RedText>
                    )}
                  </>
                ) : (
                  <Box>{value}</Box>
                )}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Stack alignItems="flex-end"></Stack>
      </Stack>
      <Divider light />
    </>
  )
}
