import {
  Container,
  IconButton,
  Link,
  Stack,
  TextareaAutosize,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { Box } from '@mui/material'
import { config, CREATE_POOL_TYPE } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useCreatePoolFormik } from './formik'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { BigNumber, ethers } from 'ethers'
import {
  EtherscanLinkType,
  getEtherscanLink,
} from '../../Util/getEtherscanLink'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import {
  formatEther,
  parseEther,
  parseUnits,
  splitSignature,
} from 'ethers/lib/utils'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { ContentCopy, Download } from '@mui/icons-material'
import DIVA712ABI from '../../abi/DIVA712ABI.json'

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

const AddToMetamask = ({
  address,
  symbol,
}: {
  address: string
  symbol: string
}) => {
  const { provider } = useConnectionContext()
  const handleAddMetaMask = async (e) => {
    const token = new ethers.Contract(address, ERC20, provider.getSigner())
    const decimal = await token.decimals()
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: address,
            symbol: symbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: decimal,
            image:
              'https://res.cloudinary.com/dphrdrgmd/image/upload/v1641730802/image_vanmig.png',
          },
        } as any,
      })
    } catch (error) {
      console.error('Error in HandleAddMetaMask', error)
    }
  }
  return (
    <>
      <Tooltip title="Add to Metamask">
        <MetaMaskImage
          src="/images/metamask.svg"
          alt="metamask"
          onClick={handleAddMetaMask}
        />
      </Tooltip>
    </>
  )
}
const congratsSvg = (
  <svg
    width="100"
    height="99"
    viewBox="0 0 100 99"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M32.2897 19.1854C31.9786 19.4965 31.7425 19.8715 31.5453 20.2826L31.5231 20.2604L0.3686 90.4413L0.399154 90.4718C-0.178603 91.5912 0.78803 93.8689 2.76852 95.8522C4.749 97.8327 7.0267 98.7993 8.14611 98.2216L8.17388 98.2493L78.3548 67.0921L78.3325 67.0671C78.7409 66.8726 79.1159 66.6365 79.4297 66.3199C83.7685 61.9812 76.7326 47.9122 63.7192 34.896C50.7002 21.8798 36.6312 14.8467 32.2897 19.1854V19.1854Z"
      fill="#DD2E44"
    />
    <path
      d="M36.1062 31.7183L1.15191 88.6775L0.3686 90.4413L0.399154 90.4718C-0.178603 91.5912 0.78803 93.8689 2.76852 95.8522C3.41294 96.4966 4.08236 96.9855 4.73789 97.3994L47.217 45.6067L36.1062 31.7183Z"
      fill="#EA596E"
    />
    <path
      d="M63.9187 34.6793C76.8904 47.6567 84.093 61.4895 79.9987 65.5783C75.9071 69.6726 62.0743 62.4728 49.0942 49.5011C36.1196 36.5237 28.9199 22.6853 33.0114 18.5938C37.1057 14.5023 50.9386 21.702 63.9187 34.6793V34.6793Z"
      fill="#A0041E"
    />
    <path
      d="M51.6384 36.1876C51.0857 36.6348 50.3635 36.8682 49.5996 36.7848C47.1886 36.5237 45.1609 35.6849 43.7415 34.3599C42.2387 32.9572 41.4971 31.0739 41.6999 29.1879C42.0554 25.8769 45.3775 22.8381 51.0412 23.4492C53.2439 23.6853 54.2272 22.977 54.2605 22.6381C54.2994 22.302 53.4911 21.3992 51.2884 21.1604C48.8774 20.8993 46.8497 20.0604 45.4275 18.7355C43.9248 17.3327 43.1804 15.4495 43.3859 13.5634C43.747 10.2524 47.0664 7.21363 52.7245 7.8275C54.33 7.99971 55.1772 7.66917 55.5355 7.45529C55.8216 7.28029 55.9355 7.11363 55.9466 7.01642C55.9799 6.68032 55.1827 5.77757 52.9745 5.53869C51.4495 5.37203 50.344 4.00541 50.5135 2.47768C50.6773 0.952737 52.0412 -0.150002 53.5717 0.0166587C59.2298 0.624971 61.8297 4.29984 61.4714 7.61362C61.1103 10.9302 57.791 13.9634 52.1273 13.3551C50.5218 13.1801 49.6829 13.5134 49.3218 13.7273C49.0357 13.8995 48.9191 14.0689 48.908 14.1634C48.8718 14.5023 49.6746 15.4022 51.8829 15.6411C57.541 16.2522 60.1409 19.9243 59.7826 23.2381C59.4243 26.5491 56.1049 29.5879 50.444 28.974C48.8385 28.8018 47.9941 29.1351 47.633 29.3462C47.3441 29.524 47.233 29.6906 47.2219 29.7851C47.1858 30.1212 47.9885 31.0239 50.194 31.2628C51.7162 31.4295 52.8245 32.7989 52.655 34.3238C52.5773 35.0849 52.1912 35.7432 51.6384 36.1876V36.1876Z"
      fill="#AA8DD8"
    />
    <path
      d="M85.1667 61.8756C90.647 60.3284 94.4275 62.7728 95.3274 65.981C96.2274 69.1865 94.2775 73.2447 88.7999 74.7863C86.6611 75.3863 86.0194 76.4084 86.1055 76.7334C86.2 77.0612 87.286 77.6001 89.4193 76.9973C94.8969 75.4557 98.6773 77.9001 99.5773 81.1055C100.483 84.3137 98.5273 88.3664 93.047 89.9108C90.9109 90.5107 90.2665 91.5357 90.3609 91.8607C90.4526 92.1857 91.5359 92.7245 93.6719 92.1246C95.1441 91.7107 96.6829 92.569 97.0968 94.0439C97.5079 95.5217 96.6496 97.0549 95.1719 97.4716C89.6971 99.0132 85.9139 96.5744 85.0083 93.3634C84.1084 90.158 86.0611 86.1053 91.5442 84.5609C93.683 83.9582 94.3247 82.9388 94.2302 82.611C94.1414 82.286 93.0581 81.7444 90.9248 82.3443C85.4417 83.8887 81.664 81.4499 80.7613 78.2362C79.8585 75.0307 81.8112 70.9781 87.2916 69.4309C89.4249 68.8337 90.0665 67.806 89.9776 67.4838C89.8832 67.156 88.8027 66.6171 86.6666 67.2171C85.1889 67.6337 83.6584 66.7727 83.2417 65.2977C82.8279 63.8255 83.6889 62.2923 85.1667 61.8756V61.8756Z"
      fill="#77B255"
    />
    <path
      d="M63.8904 54.3842C63.0737 54.3842 62.2682 54.0259 61.7182 53.3426C60.7599 52.1426 60.9571 50.3955 62.1515 49.4372C62.7571 48.9511 77.201 37.607 97.6142 40.5263C99.1336 40.743 100.189 42.1485 99.9724 43.6679C99.7558 45.1845 98.3614 46.2512 96.8281 46.0234C78.7926 43.4624 65.7542 53.6731 65.6264 53.7759C65.1098 54.187 64.4987 54.3842 63.8904 54.3842V54.3842Z"
      fill="#AA8DD8"
    />
    <path
      d="M15.9851 42.8291C15.7212 42.8291 15.4517 42.7902 15.1851 42.7124C13.7157 42.2707 12.8824 40.7236 13.324 39.2542C16.4712 28.774 19.3238 12.0496 15.8184 7.68861C15.4267 7.19418 14.8351 6.70809 13.4796 6.81086C10.8741 7.01085 11.1213 12.5079 11.1241 12.5634C11.2408 14.0939 10.0908 15.4272 8.5631 15.5411C7.01037 15.6356 5.69931 14.5078 5.58542 12.9773C5.29932 9.14689 6.49095 1.76937 13.0629 1.27216C15.9962 1.04995 18.4322 2.06936 20.1516 4.20817C26.7375 12.4051 20.0516 36.1682 18.6461 40.8513C18.285 42.0541 17.1795 42.8291 15.9851 42.8291Z"
      fill="#77B255"
    />
    <path
      d="M70.8325 28.9406C73.1336 28.9406 74.9991 27.0752 74.9991 24.7741C74.9991 22.473 73.1336 20.6076 70.8325 20.6076C68.5314 20.6076 66.666 22.473 66.666 24.7741C66.666 27.0752 68.5314 28.9406 70.8325 28.9406Z"
      fill="#5C913B"
    />
    <path
      d="M5.55536 53.9398C8.6235 53.9398 11.1107 51.4525 11.1107 48.3844C11.1107 45.3163 8.6235 42.829 5.55536 42.829C2.48722 42.829 0 45.3163 0 48.3844C0 51.4525 2.48722 53.9398 5.55536 53.9398Z"
      fill="#9266CC"
    />
    <path
      d="M90.273 56.7175C92.5741 56.7175 94.4395 54.8521 94.4395 52.551C94.4395 50.2498 92.5741 48.3844 90.273 48.3844C87.9719 48.3844 86.1064 50.2498 86.1064 52.551C86.1064 54.8521 87.9719 56.7175 90.273 56.7175Z"
      fill="#5C913B"
    />
    <path
      d="M65.2769 90.0496C67.578 90.0496 69.4434 88.1842 69.4434 85.8831C69.4434 83.582 67.578 81.7166 65.2769 81.7166C62.9758 81.7166 61.1104 83.582 61.1104 85.8831C61.1104 88.1842 62.9758 90.0496 65.2769 90.0496Z"
      fill="#5C913B"
    />
    <path
      d="M77.7751 15.0523C80.8432 15.0523 83.3305 12.565 83.3305 9.49689C83.3305 6.42875 80.8432 3.94153 77.7751 3.94153C74.7069 3.94153 72.2197 6.42875 72.2197 9.49689C72.2197 12.565 74.7069 15.0523 77.7751 15.0523Z"
      fill="#FFCC4D"
    />
    <path
      d="M90.273 26.163C92.5741 26.163 94.4395 24.2976 94.4395 21.9964C94.4395 19.6953 92.5741 17.8299 90.273 17.8299C87.9719 17.8299 86.1064 19.6953 86.1064 21.9964C86.1064 24.2976 87.9719 26.163 90.273 26.163Z"
      fill="#FFCC4D"
    />
    <path
      d="M81.9409 37.2737C84.242 37.2737 86.1075 35.4083 86.1075 33.1072C86.1075 30.8061 84.242 28.9406 81.9409 28.9406C79.6398 28.9406 77.7744 30.8061 77.7744 33.1072C77.7744 35.4083 79.6398 37.2737 81.9409 37.2737Z"
      fill="#FFCC4D"
    />
    <path
      d="M20.8355 67.8282C23.1366 67.8282 25.002 65.9628 25.002 63.6617C25.002 61.3606 23.1366 59.4951 20.8355 59.4951C18.5344 59.4951 16.6689 61.3606 16.6689 63.6617C16.6689 65.9628 18.5344 67.8282 20.8355 67.8282Z"
      fill="#FFCC4D"
    />
  </svg>
)

export function Success({
  formik,
  transactionType,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
  transactionType: string
}) {
  const { values } = formik
  const [longToken, setLongToken] = useState()
  const [shortToken, setShortToken] = useState()
  const [jsonToExport, setJsonToExport] = useState<any>()
  const [poolId, setPoolId] = useState<number>()
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)

  const chainId = provider?.network?.chainId
  const etherscanProvider = new ethers.providers.EtherscanProvider(chainId)

  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  const divaNew = new ethers.Contract(
    config[chainId!].divaAddressNew, //Goerli
    DIVA712ABI,
    provider.getSigner()
  )
  useEffect(() => {
    /**
     * Remove etherscan usage and capture transaction receipt instead
     */
    if (transactionType !== 'filloffer') {
      etherscanProvider.getHistory(userAddress).then((txs) => {
        provider
          .getTransactionReceipt(txs[txs.length - 1].hash)
          .then((txRc) => {
            const id = BigNumber.from(txRc.logs[4].topics[1]).toNumber()
            diva.getPoolParameters(id).then((pool) => {
              setShortToken(pool.shortToken)
              setLongToken(pool.longToken)
              setPoolId(id)
            })
          })
      })
    } else {
      divaNew.getPoolParameters(formik.values.poolId).then((pool) => {
        setShortToken(pool.shortToken)
        setLongToken(pool.longToken)
        setPoolId(Number(formik.values.poolId))
      })
    }
  }, [formik.values.poolId])

  return (
    <Container>
      <Box display="flex" justifyContent="center" alignItems="center">
        <Stack display="flex" justifyContent="center" alignItems="center">
          <Container
            sx={{
              ml: theme.spacing(transactionType === 'createoffer' ? 27 : 20),
            }}
          >
            {congratsSvg}
          </Container>
          <h2>Congratulations</h2>
          {transactionType === 'filloffer' && (
            <Typography>The offer has been filled successfully</Typography>
          )}
          {transactionType === 'filloffer' && <h4>Pool ID: {poolId}</h4>}
          {transactionType === 'createoffer' && (
            <Typography>Your offer has been created successfully</Typography>
          )}
          {transactionType === 'filloffer' && values.offerDirection === 'Long' && (
            <Stack direction={'row'} spacing={5}>
              <Typography>
                Long token: {'L' + poolId + ' - '}
                <Link
                  style={{ color: 'gray' }}
                  underline={'none'}
                  rel="noopener noreferrer"
                  target="_blank"
                  href={getEtherscanLink(
                    chainId,
                    longToken,
                    EtherscanLinkType.ADDRESS
                  )}
                >
                  {getShortenedAddress(longToken)}
                </Link>{' '}
              </Typography>
              <AddToMetamask address={longToken} symbol={'L-' + poolId} />
            </Stack>
          )}
          {transactionType === 'filloffer' &&
            values.offerDirection === 'Short' && (
              <Stack direction={'row'} spacing={5}>
                <Typography>
                  Long token: {'S' + poolId + ' - '}
                  <Link
                    style={{ color: 'gray' }}
                    underline={'none'}
                    rel="noopener noreferrer"
                    target="_blank"
                    href={getEtherscanLink(
                      chainId,
                      shortToken,
                      EtherscanLinkType.ADDRESS
                    )}
                  >
                    {getShortenedAddress(shortToken)}
                  </Link>{' '}
                </Typography>
                <AddToMetamask address={shortToken} symbol={'S-' + poolId} />
              </Stack>
            )}
          {transactionType === 'createoffer' && (
            <Typography>
              Copy or Download the JSON to share and complete offer creation
              process
            </Typography>
          )}
          {transactionType === 'createpool' && (
            <h4>Your pool has been created successfully</h4>
          )}
          {transactionType === 'createpool' && <h4>Pool ID: {poolId}</h4>}
          {transactionType === 'createpool' && (
            <Stack direction={'row'} spacing={5}>
              <Typography>
                Long token: {'L' + poolId + ' - '}
                <Link
                  style={{ color: 'gray' }}
                  underline={'none'}
                  rel="noopener noreferrer"
                  target="_blank"
                  href={getEtherscanLink(
                    chainId,
                    longToken,
                    EtherscanLinkType.ADDRESS
                  )}
                >
                  {getShortenedAddress(longToken)}
                </Link>{' '}
              </Typography>
              <AddToMetamask address={longToken} symbol={'L-' + poolId} />
            </Stack>
          )}
          {transactionType === 'createpool' && (
            <Stack direction={'row'} spacing={5}>
              <Typography>
                Short token: {'S' + poolId + ' - '}
                <Link
                  style={{ color: 'gray' }}
                  underline={'none'}
                  rel="noopener noreferrer"
                  target="_blank"
                  href={getEtherscanLink(
                    chainId,
                    shortToken,
                    EtherscanLinkType.ADDRESS
                  )}
                >
                  {getShortenedAddress(shortToken)}
                </Link>{' '}
              </Typography>
              <AddToMetamask address={shortToken} symbol={'S-' + poolId} />
            </Stack>
          )}
          {transactionType === 'createoffer' && (
            <TextField
              multiline
              value={JSON.stringify(values.jsonToExport, null, 2)}
              style={{ background: '#121212', width: '120%', height: '100%' }}
            />
          )}
          <Stack
            direction={'row'}
            spacing={2}
            mt={theme.spacing(2)}
            pl={theme.spacing(60)}
          >
            {transactionType === 'createoffer' && (
              <IconButton
                color="primary"
                onClick={() =>
                  navigator.clipboard.writeText(JSON.stringify(values, null, 2))
                }
              >
                <ContentCopy />
              </IconButton>
            )}
            {transactionType === 'createoffer' && (
              <IconButton
                color="primary"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = `data:text/json;chatset=utf-8,${encodeURIComponent(
                    JSON.stringify(values.jsonToExport, null, 2)
                  )}`
                  link.download = 'offer.json'
                  link.click()
                }}
              >
                <Download />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}
