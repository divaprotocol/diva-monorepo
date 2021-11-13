import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/lab'
import Container from '@mui/material/Container'
import { useState } from 'react'
import { PayoffProfile } from './PayoffProfile'

export function Create() {
  const today = new Date()
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [floor, setFloor] = useState<number>()
  const [cap, setCap] = useState<number>()
  const [strike, setStrike] = useState<number>()
  const [collateral, setCollateral] = useState<number>()
  const [shortPool, setShortPool] = useState<number>()
  const [longPool, setLongPool] = useState<number>()
  const [shortToken, setShortToken] = useState<number>()
  const [longToken, setLongToken] = useState<number>()

  return (
    <Container maxWidth="xs">
      <Box pt={5}>
        <Stepper activeStep={0} alternativeLabel>
          <Step>
            <StepLabel>Assets</StepLabel>
          </Step>
          <Step>
            <StepLabel>Oracle</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review</StepLabel>
          </Step>
        </Stepper>
      </Box>
      <Box>
        <Box pb={3} pt={4}>
          <FormControl fullWidth>
            <InputLabel>Reference Asset</InputLabel>
            <Select label="Reference Asset">
              <MenuItem value="1">1</MenuItem>
            </Select>
            <FormHelperText>Current value: 1234</FormHelperText>
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <DatePicker
              label="Expiry Date"
              minDate={today}
              value={expiryDate}
              onChange={setExpiryDate}
              renderInput={(params) => <TextField {...params} />}
            />
            <FormHelperText>8:00 pm local time (CET)</FormHelperText>
          </FormControl>
        </Box>
        <Box>
          <h3>Collateral</h3>
          <Stack pb={3} direction="row">
            <FormControl fullWidth style={{ paddingRight: '3em' }}>
              <InputLabel>Asset</InputLabel>
              <Select label="Asset">
                <MenuItem value="1">1</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <TextField
                label="Amount"
                value={collateral}
                type="number"
                onChange={(e) => setCollateral(parseInt(e.target.value))}
              />
            </FormControl>
          </Stack>
        </Box>
        {floor != null &&
          cap != null &&
          strike != null &&
          shortToken != null &&
          longToken != null && (
            <PayoffProfile
              floor={floor}
              cap={cap}
              strike={strike}
              shortTokenAmount={shortToken}
              longTokenAmount={longToken}
            />
          )}
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              inputProps={{ min: strike }}
              label="Cap"
              value={cap}
              type="number"
              onChange={(e) => setCap(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              inputProps={{ min: 0, max: strike }}
              label="Floor"
              value={floor}
              type="number"
              onChange={(e) => setFloor(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              label="Strike"
              inputProps={{ min: floor, max: cap }}
              value={strike}
              type="number"
              onChange={(e) => setStrike(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              label="Short Pool Balance"
              value={shortPool}
              type="number"
              onChange={(e) => setShortPool(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              label="Long Pool Balance"
              value={longPool}
              type="number"
              onChange={(e) => setLongPool(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              label="Short Token Amount"
              value={shortToken}
              type="number"
              onChange={(e) => setShortToken(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              label="Long Token Amount"
              value={longToken}
              type="number"
              onChange={(e) => setLongToken(parseInt(e.target.value))}
            />
          </FormControl>
        </Box>
      </Box>
    </Container>
  )
}
