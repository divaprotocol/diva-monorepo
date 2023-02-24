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
  id: string
  DropDownButtonLabel?: string
  InputValue?: string
  MenuItemLabel?: string
  onInputChange?: (e) => void
  onMenuItemClick?: () => void
}

const DropDownFilter = ({
  id,
  DropDownButtonLabel,
  MenuItemLabel,
  InputValue,
  onInputChange,
  onMenuItemClick,
}: prop) => {
  const [dropDownMenuValue, setdropDownMenuValue] = useState(null)
  const DropDownMenuOpen = Boolean(dropDownMenuValue)
  return (
    <>
      <Box marginRight="30px">
        <Button
          variant="outlined"
          id={id}
          aria-controls={DropDownMenuOpen ? `${id}` : undefined}
          aria-haspopup="true"
          aria-expanded={DropDownMenuOpen ? 'true' : undefined}
          endIcon={<ArrowDropDownIcon />}
          sx={{
            color: '#ffffffb3',
            borderColor: '#828282',
            fontSize: '13px',
            textTransform: 'capitalize',
          }}
          onClick={(e) => {
            setdropDownMenuValue(e.currentTarget)
          }}
        >
          {DropDownButtonLabel}
        </Button>
        <Menu
          id="creator-filter-menu"
          anchorEl={dropDownMenuValue}
          open={DropDownMenuOpen}
          onClose={() => setdropDownMenuValue(null)}
        >
          <MenuItem sx={{ width: '300px', height: '50px' }}>
            <Input
              value={InputValue}
              placeholder={'Enter ' + DropDownButtonLabel}
              aria-label="Filter creator"
              sx={{ width: '300px', height: '46px' }}
              onChange={onInputChange}
              startAdornment={
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              }
            />
          </MenuItem>
          <MenuItem onClick={onMenuItemClick}>{MenuItemLabel}</MenuItem>
        </Menu>
      </Box>
    </>
  )
}

export default DropDownFilter
