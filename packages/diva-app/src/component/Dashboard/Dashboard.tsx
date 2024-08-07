import React from 'react'
import { Person } from '@mui/icons-material'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { MyDataFeeds } from './MyDataFeeds'
import { MyFeeClaims } from './MyFeeClaims'
import { MyOrders } from './MyOrders'
import { MyPositions } from './MyPositions'
import { TradeHistoryTab } from './TradeHistoryTab'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { styled } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    padding: '4px',
    fontSize: '9.2px',
    height: '36px',
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}))

const Dashboard = (props: any) => {
  const { match, history } = props
  const { params } = match
  const { page } = params
  const { isMobile } = useCustomMediaQuery()
  const theme = useTheme()

  const tabNameToIndex = {
    0: 'mypositions',
    1: 'myorders',
    2: 'mydatafeeds',
    3: 'myfeeclaims',
    4: 'tradehistory',
  }
  const indexToTabName = {
    mypositions: 0,
    myorders: 1,
    mydatafeeds: 2,
    myfeeclaims: 3,
    tradehistory: 4,
  }

  const [value, setValue] = useState(indexToTabName[page])

  const handleChange = (event: any, newValue: number | null) => {
    if (newValue === value || typeof newValue !== 'number') return
    history.push(`/dashboard/${tabNameToIndex[newValue]}`)
    setValue(newValue)
  }

  return (
    <>
      <Box
        paddingX={isMobile ? 0 : 6}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: `${isMobile ? theme.spacing(3) : '0'}`,
        }}
      >
        <Person
          style={{
            fontSize: `${isMobile ? 24 : 34}`,
            paddingLeft: theme.spacing(2.5),
            paddingRight: theme.spacing(1.5),
          }}
        />
        <Typography
          sx={{
            fontSize: `${isMobile ? '20px' : '24px'}`,
            fontWeight: 500,
          }}
        >
          My Dashboard
        </Typography>
      </Box>
      <Box
        paddingX={isMobile ? 2 : 6}
        sx={{
          height: 'calc(100% - 6em)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isMobile ? (
          <div>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                flexWrap: 'wrap',
                marginTop: theme.spacing(1.6),
              }}
            >
              <StyledToggleButtonGroup
                size="small"
                value={value}
                exclusive
                onChange={handleChange}
                color="primary"
              >
                <ToggleButton value={0}>
                  <div>POSITIONS</div>
                </ToggleButton>
                <ToggleButton value={1}>
                  <div>ORDERS</div>
                </ToggleButton>
                <ToggleButton value={2}>
                  <div>DATA FEEDS</div>
                </ToggleButton>
                <ToggleButton value={3}>
                  <div>FEE CLAIMS</div>
                </ToggleButton>
                <ToggleButton value={4}>
                  <div>TRADE HISTORY</div>
                </ToggleButton>
              </StyledToggleButtonGroup>
            </Paper>
          </div>
        ) : (
          <Tabs value={value} onChange={handleChange} variant="standard">
            <Tab label="POSITIONS" />
            <Tab label="ORDERS" />
            <Tab label="DATA FEEDS" />
            <Tab label="FEE CLAIMS" />
            <Tab label="TRADE HISTORY" />
          </Tabs>
        )}
        {value === 0 && <MyPositions />}
        {value === 1 && <MyOrders />}
        {value === 2 && <MyDataFeeds />}
        {value === 3 && <MyFeeClaims />}
        {value === 4 && <TradeHistoryTab />}
      </Box>
    </>
  )
}
export default Dashboard
