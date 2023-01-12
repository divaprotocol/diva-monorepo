import React from 'react'
import { Person } from '@mui/icons-material'
import { Box, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
// import { MyRewards } from './MyRewards'
import { Report } from './Report'
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

const TellorDashboard = (props: any) => {
  const { match, history } = props
  const { params } = match
  const { page } = params
  const { isMobile } = useCustomMediaQuery()
  const theme = useTheme()

  const tabNameToIndex = {
    0: 'report',
    1: 'myrewards',
  }
  const indexToTabName = {
    report: 0,
    myrewards: 1,
  }

  const [value, setValue] = useState(indexToTabName[page])

  const handleChange = (event: any, newValue: number | null) => {
    if (newValue === value || typeof newValue !== 'number') return
    history.push(`/tellordashboard/${tabNameToIndex[newValue]}`)
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
        {
          <Tabs value={value} onChange={handleChange} variant="standard">
            <Tab label="REPORT" />
            <Tab label="MY REWARDS" />
          </Tabs>
        }
        {value === 0 && <Report />}
        {/*{value === 1 && <MyRewards />}*/}
      </Box>
    </>
  )
}
export default TellorDashboard
