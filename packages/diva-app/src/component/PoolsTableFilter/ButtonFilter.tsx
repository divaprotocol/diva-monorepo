import React, { useState } from 'react'
import { Box, Button } from '@mui/material'

type prop = {
  id: string
  ButtonLabel: string
  onClick: () => void
}

const ButtonFilter = ({ id, ButtonLabel, onClick, ...props }: prop) => {
  const [color, setColor] = useState('#ffffffb3')
  return (
    <Box {...props}>
      <Button
        variant="outlined"
        id={id}
        sx={{
          color: color,
          borderColor: color,
          fontSize: '13px',
          textTransform: 'capitalize',
        }}
        onClick={() => {
          onClick()
          color === '#ffffffb3' ? setColor('primary') : setColor('#ffffffb3')
        }}
      >
        {ButtonLabel}
      </Button>
    </Box>
  )
}

export default ButtonFilter
