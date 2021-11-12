import React from 'react'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles, withStyles } from '@mui/styles'
import LineSeries from '../Graphs/LineSeries'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import MuiTableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import MuiTableRow from '@mui/material/TableRow'

const PageDiv = styled.div`
  width: 400px;
  border-bottom: '2px solid black';
`

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    borderBottom: 'none',
  },
  table: {
    minWidth: 250,
  },
}))

const TableCell = withStyles({
  root: {
    borderBottom: 'none',
    height: 5,
  },
})(MuiTableCell)

const TableRow = withStyles({
  root: {
    height: 10,
  },
})(MuiTableRow)

const LabelStyleDiv = styled.div`
  margin-top: 25px;
  padding-top: 25px;
  padding-left: 50px;
  display: flex;
  color: #282c34;
`

const LineSeriesDiv = styled.div`
  width: 300px;
  height: 300px;
  margin-left: 50px;
  align-items: center;
  display: flex;
  padding-top: 5px;
  padding-bottom: 10px;
`

const LabelDiv = styled.div`
  margin-left: 50px;
  margin-right: 50px;
  marting-top: 20px;
  padding-left: 5px;
  padding-right: 5px;
  display: flex;
`

export default function PayOffChart() {
  const classes = useStyles()

  const order = {
    breakEven: '269000',
    maxPayout: '10',
    maxYield: '5.26x',
    maxLose: 1.9,
  }

  return (
    <PageDiv className={classes.root}>
      <LabelStyleDiv>
        <label>Pay per option</label>
      </LabelStyleDiv>
      <LineSeriesDiv>
        <LineSeries />
      </LineSeriesDiv>
      <LabelDiv>
        <TableContainer>
          <Table className={classes.table} aria-label="simple table">
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">
                  Break Even
                </TableCell>
                <TableCell align="right">{order.breakEven}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Max Payout (in DAI)
                </TableCell>
                <TableCell align="right">{order.maxPayout}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Max Yield
                </TableCell>
                <TableCell align="right">{order.maxYield}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">
                  Max Loss (in DAI)
                </TableCell>
                <TableCell align="right">{order.maxLose}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </LabelDiv>
    </PageDiv>
  )
}
