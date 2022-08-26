import { useCreatePoolFormik } from './formik'
import { Stack, TextField } from '@mui/material'
import React, { useEffect } from 'react'
import { FileUpload, FileUploadProps } from './FileUpload'
import { formatUnits } from 'ethers/lib/utils'
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
  useEffect(() => {
    if (uploadedJson !== '{}' && uploadedJson != undefined) {
      const configJson = JSON.parse(uploadedJson)
      // formik.setValues((_values) => ({
      //   ..._values,
      //   referenceAsset: uploadedJson.referenceAsset,
      //   expiryTime: uploadedJson.expiryTime,
      //   floor: uploadedJson.floor,
      //   cap: uploadedJson.cap,
      //   inflection: uploadedJson.inflection,
      //   gradient: uploadedJson.gradient,
      //   collateralToken: uploadedJson.collateralToken,
      //   collateralWalletBalance: uploadedJson.collateralWalletBalance,
      //   collateralBalance: uploadedJson.collateralBalance,
      //   collateralBalanceLong: parseFloat(uploadedJson.collateralBalanceLong),
      //   collateralBalanceShort: parseFloat(uploadedJson.collateralBalanceLong),
      //   tokenSupply: parseFloat(uploadedJson.collateralBalance),
      //   capacity: uploadedJson.capacity,
      //   dataProvider: uploadedJson.dataProvider,
      //   payoutProfile: uploadedJson.payoutProfile,
      //   offerDirection: uploadedJson.offerDirection,
      //   offerDuration: uploadedJson.offerDuration,
      //   minTakerContribution: uploadedJson.minTakerContribution,
      //   takerAddress: uploadedJson.takerAddress,
      // }))
      formik.setFieldValue('referenceAsset', configJson.referenceAsset)
      formik.setFieldValue('expiryTime', new Date(configJson.expiryTime))
      formik.setFieldValue('floor', configJson.floor)
      formik.setFieldValue('cap', configJson.cap)
      formik.setFieldValue('inflection', configJson.inflection)
      formik.setFieldValue('gradient', configJson.gradient)
      formik.setFieldValue('collateralToken', configJson.collateralToken)
      formik.setFieldValue(
        'collateralWalletBalance',
        configJson.collateralWalletBalance
      )
      formik.setFieldValue('collateralBalance', configJson.collateralBalance)
      formik.setFieldValue(
        'collateralBalanceShort',
        configJson.collateralBalanceShort
      )
      formik.setFieldValue(
        'collateralBalanceLong',
        configJson.collateralBalanceLong
      )
      formik.setFieldValue('tokenSupply', configJson.tokenSupply)
      formik.setFieldValue('capacity', configJson.capacity)
      formik.setFieldValue('dataProvider', configJson.dataProvider)
      formik.setFieldValue('payoutProfile', configJson.payoutProfile)
      formik.setFieldValue('offerDirection', configJson.offerDirection)
      formik.setFieldValue('offerDuration', configJson.offerDuration)
      formik.setFieldValue(
        'minTakerContribution',
        configJson.minTakerContribution
      )
      formik.setFieldValue('takerAddress', configJson.takerAddress)
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
