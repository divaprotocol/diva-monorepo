import {
  Alert,
  Box,
  Button,
  Stack,
  Step,
  StepLabel,
  Stepper,
  useTheme,
} from '@mui/material'
import Container from '@mui/material/Container'
import { DefinePoolAttributes } from './DefinePoolAttributes'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { useCreatePoolFormik } from './formik'
import { SelectDataFeedProvider } from './SelectDataFeedProvider'
import { LoadingButton } from '@mui/lab'
import { ethers } from 'ethers'
import { useWallet } from '@web3-ui/hooks'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { config } from '../../constants'
import { parseUnits } from 'ethers/lib/utils'
import { useState } from 'react'

export function CreatePool() {
  const [decimal, setDecimal] = useState(18)
  const [btnName, setBtnName] = useState('')
  const formik = useCreatePoolFormik()
  const theme = useTheme()
  const {
    provider,
    connection: { userAddress: account },
  } = useWallet()
  let step = null
  switch (formik.values.step) {
    case 1:
      step = <DefinePoolAttributes formik={formik} />
      break
    case 2:
      step = <SelectDataFeedProvider formik={formik} />
      break
    case 3:
      step = <ReviewAndSubmit formik={formik} />
      break
  }

  if (formik.values.collateralToken != null) {
    const token = new ethers.Contract(
      formik.values.collateralToken.id,
      ERC20,
      provider.getSigner()
    )
    token.decimals().then((decimals: number) => {
      setDecimal(decimals)
    })
    token
      .allowance(account, config[provider?.network?.chainId].divaAddress)
      .then((res) => {
        if (res.lt(parseUnits(formik.values.collateralBalance, decimal))) {
          setBtnName('Approve')
        } else {
          setBtnName('Create')
        }
      })
  }

  return (
    <Container maxWidth="md">
      <Box pt={5} pb={10}>
        <Stepper activeStep={formik.values.step - 1} alternativeLabel>
          <Step>
            <StepLabel>Pool</StepLabel>
          </Step>
          <Step>
            <StepLabel>Oracle</StepLabel>
          </Step>
          <Step>
            <StepLabel>Review</StepLabel>
          </Step>
        </Stepper>
        <Box pt={8}>
          {formik.status != null && (
            <Alert severity="info">{formik.status}</Alert>
          )}
          {step}
        </Box>
        {!formik.isValid && (
          <Box pb={3} pt={2}>
            {Object.keys(formik.errors).map((key) => (
              <Box pt={2} key={key}>
                <Alert severity="error">{(formik.errors as any)[key]}</Alert>
              </Box>
            ))}
          </Box>
        )}

        <Stack
          sx={{ paddingTop: theme.spacing(3) }}
          direction="row"
          spacing={3}
          justifyContent="space-between"
        >
          {formik.values.step > 1 && (
            <Button
              onClick={() => {
                formik.setFieldValue('step', formik.values.step - 1, true)
              }}
            >
              Go Back
            </Button>
          )}
          <LoadingButton
            variant="contained"
            onClick={() => {
              formik.handleSubmit()
            }}
            sx={{
              paddingLeft: formik.status != null ? theme.spacing(6) : undefined,
            }}
            loading={
              formik.status != null &&
              !formik.status.startsWith('Error:') &&
              !formik.status.includes('Success')
            }
            disabled={!formik.isValid}
          >
            {formik.values.step === 3 ? formik.status || btnName : 'Next'}
          </LoadingButton>
        </Stack>
      </Box>
    </Container>
  )
}
