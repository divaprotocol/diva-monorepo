import * as React from 'react'
import { useEffect } from 'react'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Search from './Search'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates'
import { isExpired } from '../../Util/Dates'
import { useSelector } from 'react-redux'
import MarketChart from '../Graphs/MarketChart.jsx'
import { useDispatch } from 'react-redux'
import { setTradingOption } from '../../Redux/TradeOption'
import { setAllOptions } from '../../Redux/TradeOption'
import { getAllOptions } from '../../DataService/FireStoreDB'
import { mapCollateralUpdate } from '../../DataService/FireStoreDB'
import { optionLiquidity } from '../../DataService/FireStoreDB'
import 'firebase/database'
import 'firebase/firestore'

import { useHistory } from 'react-router-dom'

const PageDiv = styled.div`
  width: 90%;
  margin-left: 5%;
  margin-right: 5%;
  padding: 10px;
  margin-top: 0%;
  border: '1px solid #cccccc';
  border-radius: 5px;
`

const ImgDiv = styled.div`
  display: flex;
  justify-content: flex-end;
`

const Image = styled.img`
  height: 4vmin;
  width: 4vmin;
  justify-content: center;
  pointer-events: none;
`

const LeftAssetImg = styled.img`
  flex: 2;
  flex-grow: 0;
  height: 4vmin;
  width: 4vmin;
  display: inline-block;
`
const RightAssetImg = styled.img`
  flex: 1;
  flex-grow: 0;
  height: 4vmin;
  width: 4vmin;
  display: inline-block;
`
const BuySpan = styled.span`
  background-color: green;
  padding: 15px;
`

const SellSpan = styled.span`
  background-color: pink;
  padding: 15px;
  margin: 0px auto 0px auto;
  width: 2rem%;
`

const columns = [
  { id: 'OptionImage', label: '', minWidth: 40, align: 'left' },
  { id: 'Underlying', label: 'Underlying', minWidth: 70 },
  { id: 'PayoffProfile', label: 'Payoff profile', minWidth: 100 },
  {
    id: 'Strike',
    label: 'Strike',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toLocaleString('en-US'),
  },
  {
    id: 'Inflection',
    label: 'Inflection',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toLocaleString('en-US'),
  },
  {
    id: 'Cap',
    label: 'Cap',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
  {
    id: 'Expiry',
    label: 'Expiry',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
  {
    id: 'Sell',
    label: 'Sell',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
  {
    id: 'Buy',
    label: 'Buy',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
  {
    id: 'MaxYield',
    label: 'Max Yield',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
  {
    id: 'TVL',
    label: 'TVL',
    minWidth: 70,
    align: 'right',
    format: (value: number) => value.toFixed(2),
  },
]

function createDisplayData(rows: any[]) {
  const optionsList: any[] = []
  rows.map((row) => {
    if (!isExpired(row.ExpiryDate)) {
      const displayRow = {
        OptionId: row.OptionId,
        PayoffProfile: (
          <MarketChart data={row} targetHeight={50} targetWidth={70} />
        ),
        Underlying: row.ReferenceAsset,
        Strike: row.Strike,
        Inflection: row.Inflection,
        Cap: row.Cap,
        Expiry: getDateTime(row.ExpiryDate),
        Sell: 'TBD',
        Buy: 'TBD',
        MaxYield: 'TBD',
        TVL: row.CollateralBalance + ' ' + row.CollateralTokenName,
      }
      optionsList.push(displayRow)
    }
  })
  console.log('Length ' + optionsList.length)
  return optionsList
}

const assetLogoPath = '/images/coin-logos/'
function renderRefImgs(assetName: string) {
  const assets = assetName.split('/')
  if (assets.length === 1) {
    return <Image src={assetLogoPath + assets[0] + '.png'} alt="ReactApp" />
  } else if (assets.length === 2) {
    return (
      <ImgDiv>
        <LeftAssetImg src={assetLogoPath + assets[0] + '.png'} alt="ReactApp" />
        <RightAssetImg
          src={assetLogoPath + assets[1] + '.png'}
          alt="ReactApp"
        />
      </ImgDiv>
    )
  } else {
    return <Image src="" alt="NA" />
  }
}

export default function OptionsList() {
  const dispatch = useDispatch()
  const history = useHistory()
  const rows = useSelector((state: any) => state.tradeOption.allOptions)
  const [allOptions, setOptions] = React.useState([])
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(25)
  //Need to create a separate variable to hold INITIAL all rows for search query resulting no match
  const displayAllRows = createDisplayData(rows)
  const [tableRows, setTableRows] = React.useState<any[]>([])
  const allOptionsRef = React.useRef(allOptions)
  const setAllOptionsRef = (data: any) => {
    allOptionsRef.current = data
    setOptions(data)
  }

  const handleChangePage = (_event: any, newPage: any) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const handleRowSelect = (event: any, selectedOption: any) => {
    event.preventDefault()
    //const option = allOptions[rowIndex]
    const option: any[] = allOptions.filter(
      (data: any) => data.OptionId === selectedOption.OptionId
    )
    //Set raw option Data as app state

    dispatch(setTradingOption(option[0]))
    history.push(`trade/${option[0].OptionId}`)
  }

  const searchRow = (event: any) => {
    const searchValue = event.target.value
    if (searchValue.length === 0 || searchValue === '') {
      setTableRows(displayAllRows)
    } else {
      const result = tableRows.filter((row) => {
        return row.Underlying.toLowerCase().includes(searchValue.toLowerCase())
      })
      if (result.length > 0) {
        setTableRows(result)
      }
    }
  }

  const componentDidMount = async () => {
    const options = await getAllOptions()
    dispatch(setAllOptions(options))
    setAllOptionsRef(options)
    const tableRows = createDisplayData(options)
    setTableRows(tableRows)
  }

  const mapCollateralBalance = async (collateralUpdates: any) => {
    const options = allOptionsRef.current
    const oData = mapCollateralUpdate(options, collateralUpdates)
    if (oData.length > 0) {
      const tableRows = createDisplayData(oData)
      setAllOptionsRef(oData)
      dispatch(setAllOptions(oData))
      setTableRows(tableRows)
    }
  }

  useEffect(() => {
    componentDidMount()
    const collateralUpdates = optionLiquidity.onSnapshot(
      (allOptionsLiquidity) => {
        allOptionsLiquidity.docChanges().forEach((change) => {
          if (change.type === 'added') {
            mapCollateralBalance(change.doc.data())
          }
          if (change.type === 'modified') {
            return change.doc.data()
          }
          if (change.type === 'removed') {
            return change.doc.data()
          }
        })
      }
    )
    return () => {
      collateralUpdates()
    }
    // eslint-disable-next-line
  }, [])

  return (
    <PageDiv>
      <Search searchRow={searchRow} />
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 900 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align as any}
                    style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => {
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      tabIndex={-1}
                      key={row.OptionId}
                      onClick={(event) => handleRowSelect(event, row)}
                    >
                      {columns.map((column) => {
                        if (column.id === 'OptionImage') {
                          return (
                            <TableCell align="right">
                              {renderRefImgs(row['Underlying'])}
                            </TableCell>
                          )
                        }
                        if (column.id === 'Buy') {
                          return (
                            <TableCell align="right">
                              <BuySpan>{row['Buy']}</BuySpan>
                            </TableCell>
                          )
                        }
                        if (column.id === 'Sell') {
                          return (
                            <TableCell align="right">
                              <SellSpan>{row['Sell']}</SellSpan>
                            </TableCell>
                          )
                        }
                        const value = row[column.id]
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align as any}
                          >
                            {column.format && typeof value === 'number'
                              ? column.format(value)
                              : value}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={tableRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </PageDiv>
  )
}
