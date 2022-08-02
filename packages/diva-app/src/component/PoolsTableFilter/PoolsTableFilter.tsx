import React, { useState } from 'react'
import {
  AppBar,
  Box,
  Button,
  Input,
  InputAdornment,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useHistory } from 'react-router-dom'
import { Search } from '@mui/icons-material'

type prop = {
  CreatorButtonlabel?: string
  underlyingButtonLabel?: string
  InputValue?: string
  underLyingInput?: string
  onUnderlyingChange?: () => void
  onCreatorChange?: (e) => void
  fetchDivagovernancePools?: () => void
  fetchYourPools?: () => void
}

const PoolsTableFilter = ({
  CreatorButtonlabel,
  underlyingButtonLabel,
  InputValue,
  underLyingInput,
  onCreatorChange,
  onUnderlyingChange,
  fetchDivagovernancePools,
  fetchYourPools,
}: prop) => {
  const history = useHistory()
  const theme = useTheme()
  const [creatorMenuValue, setCreatorMenuValue] = useState(null)
  const [underlyingValue, setUnderlyingValue] = useState(null)
  const CreatorMenuOpen = Boolean(creatorMenuValue)
  const UnderlyingMenuOpen = Boolean(underlyingValue)
  return (
    <AppBar
      position="static"
      sx={{
        background: theme.palette.background.default,
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <Typography color="#A4A4A4" sx={{ marginRight: '10px' }}>
          Filters:
        </Typography>
        <Box marginRight="35px">
          <Button
            variant="outlined"
            id="creator-filter-button"
            aria-controls={CreatorMenuOpen ? 'creator-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={CreatorMenuOpen ? 'true' : undefined}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              color: '#ffffff',
              borderColor: '#828282',
              fontSize: '16px',
              textTransform: 'capitalize',
            }}
            onClick={(e) => {
              setCreatorMenuValue(e.currentTarget)
            }}
          >
            {history.location.pathname === `/markets/`
              ? 'Creator'
              : CreatorButtonlabel}
          </Button>
          <Menu
            id="creator-filter-menu"
            anchorEl={creatorMenuValue}
            open={CreatorMenuOpen}
            onClose={() => setCreatorMenuValue(null)}
          >
            <MenuItem sx={{ width: '300px', height: '50px' }}>
              <Input
                value={InputValue}
                placeholder="Enter the address"
                aria-label="Filter creator"
                sx={{ width: '300px', height: '50px' }}
                onChange={onCreatorChange}
                startAdornment={
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                }
              />
            </MenuItem>
            <MenuItem
              onClick={() => {
                fetchDivagovernancePools()
                setCreatorMenuValue(null)
              }}
            >
              Diva Governance
            </MenuItem>
            <MenuItem
              onClick={() => {
                fetchYourPools()
                setCreatorMenuValue(null)
              }}
            >
              Your Pools
            </MenuItem>
          </Menu>
        </Box>

        <Box marginRight="30px">
          <Button
            variant="outlined"
            id="underlying-filter-button"
            aria-controls={UnderlyingMenuOpen ? 'creator-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={UnderlyingMenuOpen ? 'true' : undefined}
            endIcon={<ArrowDropDownIcon />}
            sx={{
              color: '#ffffff',
              fontSize: '16px',
              textTransform: 'capitalize',
            }}
            onClick={(e) => {
              setUnderlyingValue(e.currentTarget)
            }}
          >
            {underlyingButtonLabel}
          </Button>
          <Menu
            id="underlying-Menu"
            anchorEl={underlyingValue}
            open={UnderlyingMenuOpen}
            onClose={() => setUnderlyingValue(null)}
          >
            <MenuItem sx={{ width: '300px', height: '50px' }}>
              <Input
                value={underLyingInput}
                placeholder="Filter underlying"
                aria-label="Filter underlying"
                sx={{ width: '300px', height: '50px' }}
                onChange={onUnderlyingChange}
                startAdornment={
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                }
              />
            </MenuItem>
          </Menu>
        </Box>
        {/* 
        <Box>
          <FormControlLabel
            value="start"
            control={<Switch color="primary" onChange={handleExpiryPools} />}
            label="Hide Expired Pools"
            labelPlacement="start"
          />
        </Box> */}
      </Toolbar>
    </AppBar>
  )
}

export default PoolsTableFilter
