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
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'

export function CreatePool() {
  const [decimal, setDecimal] = useState(18)
  const formik = useCreatePoolFormik()
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const history = useHistory()
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
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
    formik.setFieldValue('step', formik.values.step + 1, true)
  }
  const arrowSvg = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z"
        fill="white"
      />
    </svg>
  )

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
      <Container maxWidth="xl">
        <Box pt={5} pb={10}>
          <Stepper
            sx={{
              pl: mobile ? theme.spacing(2) : theme.spacing(35),
              maxWidth: 'md',
            }}
            activeStep={formik.values.step - 1}
            alternativeLabel
          >
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
            sx={{ pr: theme.spacing(12), paddingTop: theme.spacing(3) }}
            direction="row"
            spacing={3}
            justifyContent="space-between"
            alignItems="center"
          >
            {formik.values.step !== 4 && formik.values.step !== 3 && (
              <Button
                sx={{ width: theme.spacing(16) }}
                onClick={() => {
                  formik.setFieldValue('step', formik.values.step - 1, true)
                }}
              >
                {formik.values.step > 1 ? 'Go Back' : ''}
              </Button>
            )}
            {formik.values.step === 3 ? (
              <Stack>
                <ApproveActionButtons
                  collateralTokenAddress={formik.values.collateralToken.id}
                  onTransactionSuccess={handlePoolSuccess}
                  pool={formik.values}
                  decimal={decimal}
                  textFieldValue={formik.values.collateralBalance}
                  transactionType={'create'}
                />
                <Button
                  sx={{ width: theme.spacing(16) }}
                  onClick={() => {
                    formik.setFieldValue('step', formik.values.step - 1, true)
                  }}
                >
                  'Go Back'
                </Button>
              </Stack>
            ) : formik.values.step === 4 ? (
              <Button
                variant="text"
                sx={{
                  mt: theme.spacing(8),
                  ml: theme.spacing(115),
                }}
                onClick={() => {
                  history.push('/dashboard/mypositions')
                }}
              >
                My Positions
                <ArrowForwardOutlinedIcon sx={{ ml: theme.spacing(1) }} />
              </Button>
            ) : (
              <LoadingButton
                variant="contained"
                onClick={() => {
                  formik.handleSubmit()
                }}
                sx={{ width: theme.spacing(16) }}
                loading={
                  formik.status != null &&
                  !formik.status.startsWith('Error:') &&
                  !formik.status.includes('Success')
                }
                disabled={!formik.isValid}
              >
                {formik.values.step === 3 ? formik.status || 'Create' : 'Next '}
                <ArrowForwardOutlinedIcon sx={{ ml: theme.spacing(1) }} />
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
