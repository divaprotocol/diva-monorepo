import React from 'react'
import { Button, useTheme } from '@mui/material'

type Props = React.PropsWithChildren<{
  active?: boolean
}>

export const SmallButton = (props: Props) => {
  const theme = useTheme()

  return (
    <Button
      sx={{
        color: props.active
          ? theme.palette.text.secondary
          : theme.palette.grey.,
        margin: 0,
        textTransform: 'none',
        minWidth: 'auto',
        padding: 0,
        border: 0,
        fontSize: theme.typography.caption,
        whiteSpace: 'nowrap',
      }}
    >
      {props.children}
    </Button>
  )
}
