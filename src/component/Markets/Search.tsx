import React from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { Input, InputAdornment } from '@mui/material'
import 'styled-components'

export default function Search(props: { searchRow: (val: any) => void }) {
  return (
    <Input
      autoFocus
      placeholder="Search asset"
      aria-label="search"
      onChange={props.searchRow}
      startAdornment={
        <InputAdornment position="start">
          <SearchIcon />
        </InputAdornment>
      }
    />
  )
}
