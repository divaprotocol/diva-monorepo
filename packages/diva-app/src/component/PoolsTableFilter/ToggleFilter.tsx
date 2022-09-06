import React from 'react'
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material'

type prop = {
  id: string
  FirstToggleButtonLabel?: string
  SecondToggleButtonLabel?: string
  Value?: string
  onToggle?: (string) => void
}

const ToggleFilter = ({
  id,
  FirstToggleButtonLabel,
  SecondToggleButtonLabel,
  Value,
  onToggle,
}: prop) => {
  return (
    <Box marginRight="35px">
      <ToggleButtonGroup
        exclusive
        id={id}
        value={Value}
        onChange={onToggle}
        aria-label={id}
        sx={{ height: '40px' }}
        color="primary"
      >
        <ToggleButton
          value={FirstToggleButtonLabel}
          aria-label={FirstToggleButtonLabel}
        >
          {FirstToggleButtonLabel}
        </ToggleButton>
        <ToggleButton
          value={SecondToggleButtonLabel}
          aria-label={SecondToggleButtonLabel}
        >
          {SecondToggleButtonLabel}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}

export default ToggleFilter
