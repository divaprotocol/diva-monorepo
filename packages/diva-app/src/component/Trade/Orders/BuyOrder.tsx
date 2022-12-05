import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { BigNumber } from 'ethers'
import Web3 from 'web3'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'

const expiryOrderTime = [
  {
    value: 5,
    label: '5 Minutes',
  },
  {
    value: 10,
    label: '10 Minutes',
  },
  {
    value: 20,
    label: '20 Minutes',
  },
  {
    value: 30,
    label: '30 Minutes',
  },
  {
    value: 60,
    label: '1 Hour',
  },
  {
    value: 60 * 4,
    label: '4 Hour',
  },
  {
    value: 60 * 12,
    label: '12 Hour',
  },
  {
    value: 60 * 24,
    label: '1 Day',
  },
]

const web3 = new Web3(Web3.givenProvider)
const ZERO = BigNumber.from(0)
type props = {
  option: Pool
}
const BuyOrder = ({ option }: props) => {
  const decimals = option.collateralToken.decimals
  const tokenSymbol = option.collateralToken.symbol
  const collateralTokenUnit = parseUnits('1', decimals)
  const theme = useTheme()
  const [buyAmount, setBuyAmount] = useState('')
  const [collateralBalance, setCollateralBalance] = useState(ZERO)
  const [checked, setChecked] = useState(false)
  const [numberOfOptions, setNumberOfOptions] = useState(ZERO) // User input field
  const [pricePerOption, setPricePerOption] = useState(ZERO) // User input field
  const [youPay, setYouPay] = useState(ZERO)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }
  const handleNumberOfOptions = (value: string) => {
    const nbrOptions = parseUnits(value, decimals)
    console.log(' Number of option', nbrOptions)
    setNumberOfOptions(nbrOptions)
    if (value !== '' && !checked) {
      if (pricePerOption.gt(0) && nbrOptions.gt(0)) {
        const youPay = pricePerOption.mul(nbrOptions).div(collateralTokenUnit)
        setYouPay(youPay)
      }
    } else if (checked) {
      if (value !== '') {
        // Disable fill order button if youPay amount (incl. fees) exceeds user's wallet balance
        if (collateralBalance.sub(youPay).lt(0)) {
          setOrderBtnDisabled(true)

          // TODO Below is currently not working as isApproved is updated after this part. To be revisited in a separate PR.
          // if (isApproved) {
          //   // Display message only when balance is exceeded in the presence of sufficient approval.
          //   // Otherwise the normal approval logic will take place where a user can approve a higher amount.
          //   console.log('Insufficient wallet balance')
          // }
        } else {
          setOrderBtnDisabled(false)
        }
      }
    } else {
      setYouPay(ZERO)
      setNumberOfOptions(ZERO)
      setOrderBtnDisabled(true)
    }
  }

  const handlePricePerOption = (value: string) => {
    if (value !== '') {
      const pricePerOption = parseUnits(value, decimals)
      setPricePerOption(pricePerOption)
      if (numberOfOptions.gt(0) && pricePerOption.gt(0)) {
        const youPay = numberOfOptions
          .mul(pricePerOption)
          .div(collateralTokenUnit)
        setYouPay(youPay)
      }
    } else {
      setYouPay(ZERO)
      setPricePerOption(ZERO)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Card
        sx={{
          width: '430px',
          border: '1px solid #383838',
          background: theme.palette.background.default,
          borderRadius: '5px',
          borderBottom: 0,
          p: theme.spacing(2),
        }}
      >
        <Box sx={{ my: theme.spacing(3) }}>
          <TextField
            id="outlined-number"
            label="You Buy"
            type="text"
            sx={{ width: '100%' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ color: '#929292' }}>
                  {}
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={(e) => handleNumberOfOptions(e.target.value)}
          />
          <Typography variant="h5" color="text.secondary" textAlign="right">
            Balance :
            {/* <Typography variant="h4" sx={{ display: 'inline' }}>
              {' '}
              {toExponentialOrNumber(parseFloat(tokenBalance!))}{' '}
              {pool!.collateralToken.symbol}{' '}
            </Typography> */}
            <Button
              variant="text"
              color="secondary"
              onClick={() => {
                /* if (tokenBalance != null) {
                  setTextFieldValue(tokenBalance)
                } */
              }}
            >
              {' ('}
              Max
              {')'}
            </Button>
          </Typography>
        </Box>
        <TextField
          id="outlined-number"
          label="Price per LONG Token"
          type="text"
          sx={{ width: '100%' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ color: '#929292' }}>
                {tokenSymbol}
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
          }}
          disabled={checked ? false : true}
          /* value={
            checked &&
            toExponentialOrNumber(
              Number(formatUnits(avgExpectedRate, decimals))
            )
          } */
          onChange={(e) => {
            handlePricePerOption(e.target.value)
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={checked}
              onChange={handleChecked}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          label="Set Price Target"
          color="gray"
        />
        <Box sx={{ my: theme.spacing(3) }}>
          {checked && (
            <TextField
              id="outlined-select-currency"
              select
              label="Order Expires in"
              sx={{ width: '100%' }}
              value={buyAmount}
              onChange={handleChecked}
            >
              {expiryOrderTime.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </Card>
      <Card
        sx={{
          width: '430px',
          border: '1px solid #1B3448',
          mt: theme.spacing(-1),
          py: theme.spacing(4),
          px: theme.spacing(2),
          background: 'linear-gradient(to bottom, #1B3448, #000000 110%)',
        }}
      >
        <TextField
          id="outlined-number"
          label="You Pay (inc. fees)"
          type="number"
          sx={{ width: '100%' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ color: '#929292' }}>
                {}
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
            shrink: true,
          }}
          value={buyAmount}
        />
      </Card>
    </Box>
  )
}

export default BuyOrder
