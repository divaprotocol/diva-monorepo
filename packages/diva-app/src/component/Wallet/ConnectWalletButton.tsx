import { LoadingButton } from '@mui/lab'
import { useState } from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import DisclaimerModal from '../Header/DisclaimerModal'
export function ConnectWalletButton() {
  const { isConnected, disconnect, connect } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const [openModal, setOpenModal] = useState(false)
  const chainId = useAppSelector(selectChainId)
  const modal = () => (isConnected ? setOpenModal(false) : setOpenModal(true))
  return (
    <>
      <LoadingButton
        variant="contained"
        color="primary"
        size="large"
        loading={chainId == null}
        type="submit"
        value="Submit"
        sx={{ marginLeft: '10px' }}
        onClick={() => (
          modal(), isConnected && userAddress ? disconnect() : connect()
        )}
      >
        {isConnected && userAddress
          ? getShortenedAddress(userAddress)
          : 'Connect Wallet'}
      </LoadingButton>

      {openModal ? <DisclaimerModal /> : null}
    </>
  )
}
