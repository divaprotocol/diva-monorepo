import * as React from 'react';
import { useEffect } from 'react';
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Search from './Search';
import { makeStyles } from '@material-ui/core/styles';
import styled from 'styled-components';
import { getDateTime } from '../../Util/Dates';
import { useSelector } from 'react-redux';
import MarketChart from '../Graphs/MarketChart.jsx';
import { useDispatch } from 'react-redux'
import { setTradingOption } from '../../Redux/TradeOption'

import {
    BrowserRouter as Router,
    useHistory,   
} from "react-router-dom";

const useStyles = makeStyles({
    table: {
      minWidth: 250,  
    },
  });

const PageDiv = styled.div `
    width: 90%;
    margin-left:5%;
    margin-right:5%;
    padding: 10px;
    margin-top:0%;
    border : '1px solid #cccccc';
    border-radius: 5px;
`;

const ImgDiv = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Image = styled.img`
    height: 4.0vmin;
    width: 4.0vmin;
    justify-content: center;
    pointer-events: none;
`;

const LeftAssetImg = styled.img`
    flex:2;
    flex-grow: 0;
    height: 4.0vmin;
    width: 4.0vmin;
    display: inline-block;
`
const RightAssetImg = styled.img`
    flex:1;
    flex-grow: 0;
    height: 4.0vmin;
    width: 4.0vmin;
    display: inline-block;
`
const ColumnLabel = styled.label`
`
const BuySpan = styled.span `
    background-color: green; 
    padding: 15px;
`;

const SellSpan = styled.span `
    background-color: pink; 
    padding: 15px;
    margin: 0px auto 0px auto;
    width: 2rem%;
`;

const columns = [
    { id: 'OptionImage', label: '', minWidth: 40, align: 'left', },
    { id: 'Underlying', label: 'Underlying', minWidth: 70 },
    { id: 'PayoffProfile', label: 'Payoff profile', minWidth: 100 },
    {
      id: 'Strike',
      label: 'Strike',
      minWidth: 70,
      align: 'right',
      format: (value) => value.toLocaleString('en-US'),
    },
    {
      id: 'Inflection',
      label: 'Inflection',
      minWidth: 70,
      align: 'right',
      format: (value) => value.toLocaleString('en-US'),
    },
    {
      id: 'Cap',
      label: 'Cap',
      minWidth: 70,
      align: 'right',
      format: (value) => value.toFixed(2),
    },
    {
        id: 'Expiry',
        label: 'Expiry',
        minWidth: 70,
        align: 'right',
        format: (value) => value.toFixed(2),
    },
    {
        id: 'Sell',
        label: 'Sell',
        minWidth: 70,
        align: 'right',
        format: (value) => value.toFixed(2),
    },
    {
        id: 'Buy',
        label: 'Buy',
        minWidth: 70,
        align: 'right',
        format: (value) => value.toFixed(2),
    },
    {
        id: 'MaxYield',
        label: 'Max Yield',
        minWidth: 70,
        align: 'right',
        format: (value) => value.toFixed(2),
    },
    {
        id: 'TVL',
        label: 'TVL',
        minWidth: 70,
        align: 'right',
        format: (value) => value.toFixed(2),
    },
  ];
    
function createDisplayData(rows) {
    var optionsList = []
    rows.map(row => {
        const displyRow = {
            OptionId : row.OptionId,
            PayoffProfile : <MarketChart data={row} targetHeight={50} targetWidth={70} />,
            Underlying : row.ReferenceAsset,
            Strike : row.Strike,
            Inflection : row.Inflection,
            Cap : row.Cap,
            Expiry : getDateTime(row.ExpiryDate),
            Sell : "TBD",
            Buy : "TBD",
            MaxYield : "TBD",
            TVL : "TBD"
        }
        optionsList.push(displyRow)
    })
    return optionsList
}

const assetLogoPath = '/images/coin-logos/'
function renderRefImgs(assetName) {
    const assets = assetName.split('/')
    if(assets.length === 1) {
        return(<Image src={assetLogoPath + assets[0]+ '.png'} alt="ReactApp"/>)
    } else if (assets.length === 2) {
        return(
            <ImgDiv>
                <LeftAssetImg src={assetLogoPath + assets[0]+ '.png'}  alt="ReactApp"/>
                <RightAssetImg src={assetLogoPath + assets[1]+ '.png'}  alt="ReactApp"/>
            </ImgDiv>
        )
    } else {
        return(<Image src="" alt="NA"/>)
    }
}

export default function OptionsListNew() {
  const dispatch = useDispatch()
  const history = useHistory();
  const rows = useSelector(state => state.tradeOption.allOptions)
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  //Need to create a separate variable to hold initial all rows for search query resulting no match
  const displayAllRows = createDisplayData(rows)
  const [tableRows, setTableRows] = React.useState([])
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage); 
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleRowSelect = (event, rowIndex) => {
    event.preventDefault()
    const option = rows[rowIndex]
    //Set raw option Data as app state
    dispatch(setTradingOption(option))
    history.push(`trade/${option.OptionId}`)
  }

  const searchRow = (event) => {
    const searchValue = event.target.value
    if(searchValue.length === 0 || searchValue === '') {
        setTableRows(displayAllRows)
    } else {
        const result = tableRows.filter((row) => {
            return row.Underlying.toLowerCase().includes(searchValue.toLowerCase())
        });
        if(result.length > 0) {
            setTableRows(result)
        }
    }
  }

  const componentDidMount = () => {
    const tableRows = createDisplayData(rows)
    setTableRows(tableRows)
  }

  useEffect(() => {
    if(tableRows.length === 0) {
        componentDidMount()
    }
  }, [rows])
  return (
    <PageDiv>
        <Search searchRow={searchRow}/>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 700 }}  >
                <Table stickyHeader aria-label="sticky table">
                <TableHead>
                    <TableRow>
                    {columns.map((column) => (
                        <TableCell
                            key={column.id}
                            align={column.align}
                            style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                        >
                            {column.label}
                        </TableCell>
                    ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    { tableRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                        return (
                        <TableRow hover role="checkbox" tabIndex={-1} key={row.OptionId} onClick={event =>
                            handleRowSelect(event, tableRows.indexOf(row))
                          }>
                            {columns.map((column) => {
                                if(column.id === 'OptionImage'){
                                    return(
                                        <TableCell align="right">
                                            {renderRefImgs(row['Underlying'])}
                                        </TableCell>
                                    )
                                }
                                if(column.id === 'Buy'){
                                    return(
                                        <TableCell align="right">
                                            <BuySpan>{row['Buy']}</BuySpan>
                                        </TableCell>
                                    )
                                }
                                if(column.id === 'Sell'){
                                    return(
                                        <TableCell align="right">
                                            <SellSpan>{row['Sell']}</SellSpan>
                                        </TableCell>
                                    )
                                }
                                const value = row[column.id];
                                return (
                                    <TableCell key={column.id} align={column.align} style={column.style}>
                                    {column.format && typeof value === 'number'
                                        ? column.format(value)
                                        : value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                        );
                    })}
                </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={rows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    </PageDiv>
  );
}