import { Add, Check, PlusOne, Tune } from '@mui/icons-material'
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { useParams } from 'react-router-dom'
import { selectPool } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { SmallButton } from '../SmallButton'

export default function CreateOrder() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const isLong = params.tokenType === 'long'
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const tokenAddress = isLong ? pool.longToken.id : pool.shortToken.id

  const theme = useTheme()
  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.grey[800]}`,
        borderRadius: '10px',
      }}
    >
      <Stack padding={3} paddingBottom={5} spacing={4}>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <SmallButton active>Buy</SmallButton>
            <SmallButton>Sell</SmallButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <SmallButton>Fill order</SmallButton>
            <SmallButton active>Create order</SmallButton>
          </Stack>
        </Stack>
        <TextField
          defaultValue={0}
          label="You buy"
          helperText="There are x Long tokens in your wallet"
        />
        <TextField defaultValue={0} label="Price per token" />
      </Stack>
      <Stack
        padding={3}
        paddingTop={5}
        spacing={4}
        sx={{
          borderTop: `1px solid ${theme.palette.grey[800]}`,
          background:
            'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
        }}
      >
        <TextField
          defaultValue={0}
          label="You pay"
          helperText="Your wallet balance is 510 DAI"
        />
        <Stack direction="row" justifyContent="space-between">
          <Button
            size="large"
            variant="contained"
            sx={{
              background:
                'linear-gradient(103.17deg, #3393E0 -0.15%, #0059A2 61.59%)',
            }}
          >
            <Check sx={{ marginRight: '.2em', marginLeft: '-.3em' }} />
            Approve
          </Button>
          <Button variant="contained" disabled size="large">
            <Add
              sx={{
                marginRight: '.2em',
                marginBottom: '0.05em',
                marginLeft: '-.3em',
              }}
            />
            Fill order
          </Button>
        </Stack>
        <Stack direction="row" justifyContent="end">
          <SmallButton>
            <Tune /> Advanced Settings
          </SmallButton>
        </Stack>
      </Stack>
    </Box>
  )
}
