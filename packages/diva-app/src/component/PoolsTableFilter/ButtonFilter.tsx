import React from 'react'
import { Box, Button } from '@mui/material'

type prop = {
  id: string
  ButtonLabel: string
  ButtonColor: string
  onClick: () => void
}

const ButtonFilter = ({ id, ButtonLabel, ButtonColor, onClick }: prop) => {
  return (
    <Box marginRight="35px">
      <Button
        variant="outlined"
        id={id}
        sx={{
          color: '#ffffff',
          borderColor: '#ffffff',
          fontSize: '16px',
          textTransform: 'capitalize',
          ':active': {
            borderColor: '#3393E0',
            color: '#3393E0',
          },
        }}
        onClick={onClick}
      >
        {ButtonLabel}
      </Button>
    </Box>
  )
}

export default ButtonFilter
