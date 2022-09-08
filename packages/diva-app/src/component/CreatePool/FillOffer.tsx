import { useCreatePoolFormik } from './formik'
import { Stack, TextField } from '@mui/material'
import React, { useEffect } from 'react'
import { FileUpload, FileUploadProps } from './FileUpload'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { useErcBalance } from '../../hooks/useErcBalance'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import { BigNumber } from 'ethers'
// const fileUploadProp: FileUploadProps = {
//   accept: 'application/json',
//   onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files !== null && event.target?.files?.length > 0) {
//       console.log(`Saving ${event.target.value}`)
//     }
//   },
//   onDrop: (event: React.DragEvent<HTMLElement>) => {
//     console.log(JSON.stringify(event.dataTransfer.files[0]))
//     const fileReader = new FileReader()
//     fileReader.readAsText(event.dataTransfer.files[0], 'UTF-8')
//     fileReader.onload = (e) => {
//       console.log('e.target.result', e.target.result)
//     }
//   },
// }
export function FillOffer({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const [uploadedJson, setUploadedJson] = React.useState<any>('{}')
  const userAddress = useAppSelector(selectUserAddress)
  const walletBalance = useErcBalance(JSON.parse(uploadedJson).collateralToken)
  useEffect(() => {
    if (uploadedJson !== '{}' && uploadedJson != undefined) {
      const configJson = JSON.parse(uploadedJson)

      formik.setFieldValue(
        'offerDirection',
        configJson.makerDirection ? 'Long' : 'Short'
      )
      formik.setFieldValue('referenceAsset', configJson.referenceAsset)
      formik.setFieldValue('expiryTime', new Date(configJson.expiryTime * 1000))
      formik.setFieldValue('floor', formatEther(configJson.floor))
      formik.setFieldValue('cap', formatEther(configJson.cap))
      formik.setFieldValue('inflection', formatEther(configJson.inflection))
      formik.setFieldValue(
        'collateralBalanceLong',
        formatEther(configJson.takerCollateralAmount)
      )
      formik.setFieldValue(
        'collateralBalanceShort',
        formatEther(configJson.makerCollateralAmount)
      )
      console.log(parseFloat(configJson.makerCollateralAmount), 'maker')
      formik.setFieldValue(
        'gradient',
        parseFloat(formatEther(configJson.gradient))
      )
      formik.setFieldValue('collateralWalletBalance', walletBalance)
      if (configJson.maker === userAddress) {
        formik.setFieldValue(
          'collateralBalance',
          formatEther(
            BigNumber.from(configJson.makerCollateralAmount).add(
              BigNumber.from(configJson.takerCollateralAmount)
            )
          )
        )
      } else {
        formik.setFieldValue(
          'collateralBalance',
          formatEther(configJson.takerCollateralAmount)
        )
      }
      formik.setFieldValue('collateralToken.id', configJson.collateralToken)
      formik.setFieldValue('capacity', configJson.capacity)
      formik.setFieldValue('dataProvider', configJson.dataProvider)
      formik.setFieldValue('offerDuration', configJson.offerExpiry)
      formik.setFieldValue(
        'minTakerContribution',
        formatEther(configJson.minimumTakerFillAmount)
      )
      formik.setFieldValue(
        'takerAddress',
        configJson.taker === '0x0000000000000000000000000000000000000000'
          ? 'Everyone'
          : configJson.taker
      )
      formik.setFieldValue('jsonToExport', {
        maker: configJson.maker,
        taker: configJson.taker,
        makerCollateralAmount: configJson.makerCollateralAmount,
        takerCollateralAmount: configJson.takerCollateralAmount,
        makerDirection: configJson.makerDirection,
        offerExpiry: configJson.offerExpiry,
        minimumTakerFillAmount: configJson.minimumTakerFillAmount,
        referenceAsset: configJson.referenceAsset,
        expiryTime: configJson.expiryTime,
        floor: configJson.floor,
        inflection: configJson.inflection,
        cap: configJson.cap,
        gradient: configJson.gradient,
        collateralToken: configJson.collateralToken,
        dataProvider: configJson.dataProvider,
        capacity: configJson.capacity,
        salt: configJson.salt,
      })
      formik.setFieldValue('signature', configJson.signature)
      // formik.setFieldValue('step', 3, false)
    }
    console.log('formik values', formik.values)
    console.log(uploadedJson, 'uploadedJson')
  }, [uploadedJson])

  return (
    <Stack>
      <TextField
        multiline
        value={uploadedJson}
        minRows={10}
        maxRows={20}
        style={{ background: '#121212', width: '100%', height: '100%' }}
      />
      <FileUpload
        {...{
          accept: 'application/json',
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            if (
              event.target.files !== null &&
              event.target?.files?.length > 0
            ) {
              const fileReader = new FileReader()
              fileReader.readAsText(event.target.files[0], 'UTF-8')
              fileReader.onload = (e) => {
                console.log('e.target.result', e.target.result)
                setUploadedJson(e.target.result)
              }
            }
          },
          onDrop: (event: React.DragEvent<HTMLElement>) => {
            console.log(JSON.stringify(event.dataTransfer.files[0]))
            const fileReader = new FileReader()
            fileReader.readAsText(event.dataTransfer.files[0], 'UTF-8')
            fileReader.onload = (e) => {
              console.log('e.target.result', e.target.result)
              setUploadedJson(e.target.result)
            }
          },
        }}
      />
    </Stack>
  )
}
