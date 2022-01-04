import { GridColDef } from '@mui/x-data-grid/x-data-grid'
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Stack,
  TextField,
} from '@mui/material'
import { useWeb3React } from '@web3-react/core'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { SideMenu } from './SideMenu'
import PoolsTable, { CoinImage } from '../PoolsTable'
import { ethers } from 'ethers'
import DIVA_ABI from '../../contracts/abis/DIVA.json'
import { addresses } from '../../config'
import React from 'react'
import { chainIdtoName } from '../../Util/chainIdToName'

const SubmitCell = (props: any) => {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  const diva = new ethers.Contract(
    addresses[3].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )

  const [open, setOpen] = React.useState(false)
  const [btnDisabled, setBtnDisabled] = React.useState(true)
  const [textFieldValue, setTextFieldValue] = React.useState('')
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  diva.getPoolParametersById(props.id.split('/')[0]).then((pool: any) => {
    setBtnDisabled(
      props.row.Status === 'Submitted' ||
        props.row.Status === 'Confirmed' ||
        pool.expiryDate.toNumber() * 1000 > Date.now()
    )
  })

  return (
    <Container>
      <Button variant="contained" onClick={handleOpen} disabled={btnDisabled}>
        Submit value
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for this option
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <TextField
            value={textFieldValue}
            onChange={(e) => {
              e.stopPropagation()
              setTextFieldValue(e.target.value)
            }}
          />
          <Button
            color="primary"
            type="submit"
            onClick={() => {
              diva.setFinalReferenceValueById(
                props.id.split('/')[0],
                textFieldValue,
                true
              )
              handleClose()
            }}
          >
            Submit value
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const columns: GridColDef[] = [
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <CoinImage assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    flex: 1,
  },
  { field: 'Floor', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Ceiling', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
  },
  {
    field: 'finalValue',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Final Value',
  },
  {
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'subPeriod',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Submission period ends in',
    minWidth: 200,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: SubmitCell,
  },
]

export function Dashboard() {
  const { account } = useWeb3React()

  return account ? (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
    >
      <SideMenu />
      <PoolsTable
        filter={(pool) =>
          pool.dataFeedProvider.toLowerCase() === account?.toLowerCase()
        }
        columns={columns}
        isDashboard={true}
      />
    </Stack>
  ) : (
    <ConnectWalletButton />
  )
}
