import React, { useState } from 'react'
import { Box, Button, SxProps } from '@mui/material'

type prop = {
  id: string
  ButtonLabel: string
  sx?: SxProps
  onClick: () => void
}

const ButtonFilter = ({ id, ButtonLabel, onClick, sx = [] }: prop) => {
  const [color, setColor] = useState('#ffffffb3')
  return (
    <Box marginRight={id.startsWith('Has') ? 0 : '30px'}>
      <Button
        variant="outlined"
        id={id}
        sx={[
          {
            color: color,
            borderColor: color,
            fontSize: '13px',
            textTransform: 'capitalize',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
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
