import React, { useState } from 'react'
import { Box, Button } from '@mui/material'

type prop = {
  id: string
  ButtonLabel: string
  onClick: () => void
}

const ButtonFilter = ({ id, ButtonLabel, onClick }: prop) => {
  const [color, setColor] = useState('#ffffff')
  return (
    <Box marginRight="35px">
      <Button
        variant="outlined"
        id={id}
        sx={{
          color: color,
          borderColor: color,
          fontSize: '16px',
          textTransform: 'capitalize',
        }}
        onClick={() => {
          onClick()
          color === '#ffffff' ? setColor('primary') : setColor('#ffffff')
        }}
      >
        {ButtonLabel}
      </Button>
    </Box>
  )
}

export default ButtonFilter
