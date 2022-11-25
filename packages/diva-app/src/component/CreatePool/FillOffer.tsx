import { useCreatePoolFormik } from './formik'
import { Stack, TextField } from '@mui/material'
import React, { useEffect } from 'react'
import { FileUpload, FileUploadProps } from './FileUpload'
import { formatUnits } from 'ethers/lib/utils'
import { useErcBalance } from '../../hooks/useErcBalance'
import ERC20 from '../../abi/ERC20ABI.json'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import { BigNumber, ethers } from 'ethers'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export function FillOffer({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const [uploadedJson, setUploadedJson] = React.useState<any>('{}')
  const userAddress = useAppSelector(selectUserAddress)
  const walletBalance = useErcBalance(JSON.parse(uploadedJson).collateralToken)
  const { provider } = useConnectionContext()
  const [decimal, setDecimal] = React.useState(18)
  const { isConnected, disconnect, connect } = useConnectionContext()
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        disconnect()
        connect()
      })
    }
  }, [])
  useEffect(() => {
    if (uploadedJson !== '{}' && uploadedJson != undefined) {
      const configJson = JSON.parse(uploadedJson)
      const token = new ethers.Contract(
        configJson.collateralToken,
        ERC20,
        provider.getSigner()
      )
      token.decimals().then((decimals: number) => {
        setDecimal(decimals)
        formik.setFieldValue('collateralToken.decimals', decimals)
        formik.setFieldValue(
          'yourShare',
          parseFloat(formatUnits(configJson.takerCollateralAmount, decimals))
        )
        formik.setFieldValue(
          'makerShare',
          Number(formatUnits(configJson.makerCollateralAmount, decimals))
        )
        if (configJson.maker.toLowerCase() === userAddress.toLowerCase()) {
          formik.setFieldValue(
            'collateralBalance',
            formatUnits(
              BigNumber.from(configJson.makerCollateralAmount).add(
                BigNumber.from(configJson.takerCollateralAmount)
              ),
              decimals
            )
          )
        } else {
          formik.setFieldValue(
            'collateralBalance',
            formatUnits(configJson.takerCollateralAmount, decimals)
          )
        }
        formik.setFieldValue(
          'minTakerContribution',
          formatUnits(configJson.minimumTakerFillAmount, decimals)
        )
      })

      formik.setFieldValue(
        'offerDirection',
        configJson.makerIsLong ? 'Short' : 'Long'
      )
      formik.setFieldValue('referenceAsset', configJson.referenceAsset)
      formik.setFieldValue('expiryTime', new Date(configJson.expiryTime * 1000))
      formik.setFieldValue('floor', formatUnits(configJson.floor))
      formik.setFieldValue('cap', formatUnits(configJson.cap))
      formik.setFieldValue('inflection', formatUnits(configJson.inflection))
      formik.setFieldValue(
        'gradient',
        parseFloat(formatUnits(configJson.gradient, decimal))
      )
      formik.setFieldValue('collateralWalletBalance', walletBalance)

      formik.setFieldValue('collateralToken.id', configJson.collateralToken)
      formik.setFieldValue(
        'capacity',
        configJson.capacity === ethers.constants.MaxUint256.toString()
          ? 'Unlimited'
          : configJson.capacity
      )
      formik.setFieldValue('dataProvider', configJson.dataProvider)
      formik.setFieldValue('offerDuration', configJson.offerExpiry)

      formik.setFieldValue('takerAddress', configJson.taker)
      formik.setFieldValue('jsonToExport', {
        maker: configJson.maker,
        taker: configJson.taker,
        makerCollateralAmount: configJson.makerCollateralAmount,
        takerCollateralAmount: configJson.takerCollateralAmount,
        makerIsLong: configJson.makerIsLong,
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
        permissionedERC721Token: ethers.constants.AddressZero,
        salt: configJson.salt,
      })
      formik.setFieldValue('signature', configJson.signature)
      // formik.setFieldValue('step', 3, false)
    }
  }, [formik.values.collateralToken.id, uploadedJson, decimal])

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
                setUploadedJson(e.target.result)
              }
            }
          },
          onDrop: (event: React.DragEvent<HTMLElement>) => {
            const fileReader = new FileReader()
            fileReader.readAsText(event.dataTransfer.files[0], 'UTF-8')
            fileReader.onload = (e) => {
              setUploadedJson(e.target.result)
            }
          },
        }}
      />
    </Stack>
  )
}
