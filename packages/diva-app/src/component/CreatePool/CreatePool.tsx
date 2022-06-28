import {
  Alert,
  Box,
  Button,
  Snackbar,
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
import ERC20 from '@diva/contracts/abis/erc20.json'
import { useEffect, useState } from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { ApproveActionButtons } from '../ApproveActionButtons'
import { useHistory } from 'react-router-dom'
import { Add } from '@mui/icons-material'
import { Success } from './Success'

export function CreatePool() {
  const [decimal, setDecimal] = useState(18)
  const formik = useCreatePoolFormik()
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const history = useHistory()

  const [isSnackbarOpen, setIsSnackbarOpen] = useState<boolean>(false)

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
    case 4:
      step = <Success formik={formik} />
      break
  }
  useEffect(() => {
    if (formik.values.collateralToken != null && provider != null) {
      const token = new ethers.Contract(
        formik.values.collateralToken.id,
        ERC20,
        provider.getSigner()
      )
      token.decimals().then((decimals: number) => {
        setDecimal(decimals)
      })
    }
  }, [formik.values.collateralToken])

  // actions after pool is successfully created
  const handlePoolSuccess = () => {
    setIsSnackbarOpen(true)
    formik.setFieldValue('step', formik.values.step + 1, true)
  }

  return (
    <Box>
      <Box
        paddingX={6}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Add style={{ fontSize: 34, padding: 20, paddingRight: 10 }} />
        <h2> Create Pool</h2>
      </Box>
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
            <Step>
              <StepLabel>Success</StepLabel>
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
            alignItems="center"
          >
            {formik.values.step > 1 && formik.values.step !== 4 && (
              <Button
                sx={{ width: theme.spacing(16) }}
                onClick={() => {
                  formik.setFieldValue('step', formik.values.step - 1, true)
                }}
              >
                Go Back
              </Button>
            )}
            {formik.values.step === 3 ? (
              <ApproveActionButtons
                collateralTokenAddress={formik.values.collateralToken.id}
                onTransactionSuccess={handlePoolSuccess}
                pool={formik.values}
                decimal={decimal}
                textFieldValue={formik.values.collateralBalance}
                transactionType={'create'}
              />
            ) : formik.values.step === 4 ? (
              <Button
                variant="text"
                sx={{
                  mt: theme.spacing(8),
                  ml: theme.spacing(80),
                }}
                onClick={() => {
                  history.push('/dashboard/mypositions')
                }}
              >
                My Positions
              </Button>
            ) : (
              <LoadingButton
                variant="contained"
                onClick={() => {
                  formik.handleSubmit()
                }}
                sx={{
                  paddingLeft:
                    formik.status != null ? theme.spacing(6) : undefined,
                }}
                loading={
                  formik.status != null &&
                  !formik.status.startsWith('Error:') &&
                  !formik.status.includes('Success')
                }
                disabled={!formik.isValid}
              >
                {formik.values.step === 3 ? formik.status || 'Create' : 'Next'}
              </LoadingButton>
            )}
          </Stack>
          <Snackbar
            open={isSnackbarOpen}
            autoHideDuration={6000}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Pool was successfully created. Redirecting to My Positions page.
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Box>
  )
}
