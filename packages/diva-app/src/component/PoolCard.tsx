import { Box } from '@mui/system'
import { GridRowModel } from '@mui/x-data-grid'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { config } from '../constants'
import { fetchPool, selectChainId, selectPool } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'

interface Props {
  row: GridRowModel
}

const PoolCard = ({ row }: Props) => {
  const dispatch = useDispatch()
  const chainId = useAppSelector(selectChainId)

  return (
    <Box
      sx={{
        minWidth: '400px',
        width: '100%',
        height: '660px',
        border: '1px solid #383838',
        backgroundColor: '#121212',
        borderRadius: '8px',
      }}
    >
      <h1>{row.Id}</h1>
    </Box>
  )
}

export default PoolCard
