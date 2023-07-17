import { Box, Stack, Grid, Typography, Divider } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import DeleteIcon from '@mui/icons-material/Delete'
import { selectChainId } from '../../Redux/appSlice'
import { useHistory } from 'react-router-dom'
import { GridRowModel } from '@mui/x-data-grid'
import { GreenText, RedText } from '../Trade/Orders/UiStyles'
import { ExpiresInCell } from '../Markets/ExpiresInCell'
import { useAppSelector } from '../../Redux/hooks'

export const MyOrdersPoolCard = ({
  row,
  cancelOrder,
  loadingValue,
}: {
  row: GridRowModel
  cancelOrder: (event: any, orderHash: string, chainId: string) => Promise<void>
  loadingValue: any
}) => {
  const {
    icon,
    PoolId,
    AssetId,
    type,
    quantity,
    price,
    payReceive,
    position,
    orderHash,
  } = row

  const history = useHistory()
  const chainId = useAppSelector(selectChainId)

  const DATA_ARRAY = [
    {
      label: 'Type',
      value: type,
    },
    {
      label: 'Quantity',
      value: quantity.toFixed(4),
    },
    {
      label: 'Price',
      value: price.toFixed(4),
    },
    {
      label: 'Pay/Receive',
      value: payReceive.toFixed(4),
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
        onClick={() => {
          history.push(`../../${PoolId}/${position}`)
        }}
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
              {icon}
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
              Order Expires In
            </Typography>
            <ExpiresInCell row={row} {...row} />
          </Stack>
        </Box>
        <Grid
          container
          rowGap={1.6}
          justifyContent="space-between"
          columnGap={'3px'}
        >
          {DATA_ARRAY.map(({ label, value }, i) => (
            <Grid item key={i} xs={5}>
              <Stack
                direction="row"
                justifyContent={'space-between'}
                sx={{
                  flexGrow: 1,
                }}
              >
                <Box
                  sx={{
                    color: '#828282',
                    minWidth: '60px',
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
        <Stack alignItems="flex-end">
          <LoadingButton
            variant="outlined"
            startIcon={<DeleteIcon />}
            size="small"
            onClick={(event) => cancelOrder(event, orderHash, chainId)}
            sx={{
              fontSize: '10px',
            }}
            loading={loadingValue.get(orderHash) || false}
          >
            Cancel
          </LoadingButton>
        </Stack>
      </Stack>
      <Divider light />
    </>
  )
}
