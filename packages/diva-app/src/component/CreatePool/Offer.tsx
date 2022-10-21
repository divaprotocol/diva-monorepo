import { useCreatePoolFormik } from './formik'
import { useQuery } from 'react-query'
import { config } from '../../constants'
import { queryTestUser } from '../../lib/queries'
import { request } from 'https'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { BigNumber, ethers } from 'ethers'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import Container from '@mui/material/Container'
import { ReviewAndSubmit } from './ReviewAndSubmit'
import { Alert, Box, useTheme } from '@mui/material'
import { ApproveActionButtons } from '../ApproveActionButtons'
import { Success } from './Success'
export function Offer() {
  const formik = useCreatePoolFormik()
  const { provider } = useConnectionContext()
  const theme = useTheme()
  const userAddress = useAppSelector(selectUserAddress)
  const [decimal, setDecimal] = useState(18)
  const offerHash = window.location.pathname.split('/')[2]
  const jsonResponse = useQuery(`json-${offerHash}`, async () => {
    const response = axios.get('/offer_create_contingent_pool/' + offerHash)
    return response
  })

  useEffect(() => {
    if (jsonResponse.isSuccess) {
      const token = new ethers.Contract(
        jsonResponse.data.data.collateralToken,
        ERC20,
        provider.getSigner()
      )

      formik.setFieldValue('signature', jsonResponse.data.data.signature)
      token.decimals().then((decimals: number) => {
        setDecimal(decimals)
        formik.setFieldValue('jsonToExport', jsonResponse.data.data)
        formik.setFieldValue('collateralToken.decimals', decimals)
        formik.setFieldValue(
          'yourShare',
          parseFloat(
            formatUnits(jsonResponse.data.data.takerCollateralAmount, decimals)
          )
        )
        formik.setFieldValue(
          'makerShare',
          Number(
            formatUnits(jsonResponse.data.data.makerCollateralAmount, decimals)
          )
        )
        if (
          jsonResponse.data.data.maker.toLowerCase() ===
          userAddress.toLowerCase()
        ) {
          formik.setFieldValue(
            'collateralBalance',
            formatUnits(
              BigNumber.from(jsonResponse.data.data.makerCollateralAmount).add(
                BigNumber.from(jsonResponse.data.data.takerCollateralAmount)
              ),
              decimals
            )
          )
        } else {
          formik.setFieldValue(
            'collateralBalance',
            formatUnits(jsonResponse.data.data.takerCollateralAmount, decimals)
          )
        }
        formik.setFieldValue(
          'minTakerContribution',
          formatUnits(jsonResponse.data.data.minimumTakerFillAmount, decimals)
        )
      })
      formik.setFieldValue(
        'offerDirection',
        jsonResponse.data.data.makerDirection ? 'Short' : 'Long'
      )
      formik.setFieldValue(
        'referenceAsset',
        jsonResponse.data.data.referenceAsset
      )
      formik.setFieldValue(
        'expiryTime',
        new Date(jsonResponse.data.data.expiryTime * 1000)
      )
      formik.setFieldValue('floor', formatEther(jsonResponse.data.data.floor))
      formik.setFieldValue('cap', formatEther(jsonResponse.data.data.cap))
      formik.setFieldValue(
        'inflection',
        formatEther(jsonResponse.data.data.inflection)
      )

      formik.setFieldValue(
        'gradient',
        parseFloat(formatEther(jsonResponse.data.data.gradient))
      )
      formik.setFieldValue('collateralWalletBalance', jsonResponse.data.data)

      formik.setFieldValue(
        'collateralToken.id',
        jsonResponse.data.data.collateralToken
      )
      formik.setFieldValue(
        'capacity',
        jsonResponse.data.data.capacity ===
          '115792089237316195423570985008687907853269984665640564039457584007913129639935'
          ? 'Unlimited'
          : jsonResponse.data.data.capacity
      )
      formik.setFieldValue('dataProvider', jsonResponse.data.data.dataProvider)
      formik.setFieldValue('offerDuration', jsonResponse.data.data.offerExpiry)

      formik.setFieldValue('takerAddress', jsonResponse.data.data.taker)
    }
  }, [jsonResponse.isSuccess])
  let step = null
  switch (formik.values.step) {
    case 1:
      step = <ReviewAndSubmit formik={formik} transaction={'filloffer'} />
      break
    case 2:
      step = <Success formik={formik} transactionType={'filloffer'} />
      break
  }
  return (
    <Container maxWidth="xl">
      <Box pt={8}>
        {formik.status != null && (
          <Alert severity="info">{formik.status}</Alert>
        )}
        {provider?.network?.chainId != null && step}
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
      {formik.values.step === 1 &&
        userAddress != null &&
        provider?.network?.chainId != null && (
          <Container sx={{ mr: theme.spacing(9) }}>
            <ApproveActionButtons
              collateralTokenAddress={formik.values.collateralToken.id}
              onTransactionSuccess={() => {
                formik.setFieldValue('step', formik.values.step + 1, true)
              }}
              pool={formik.values}
              decimal={decimal}
              textFieldValue={formik.values.collateralBalance}
              transactionType={'filloffer'}
              formik={formik}
            />
          </Container>
        )}
    </Container>
  )
}