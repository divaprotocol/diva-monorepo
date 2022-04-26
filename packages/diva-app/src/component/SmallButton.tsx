import React from 'react'
import { Typography, useTheme } from '@mui/material'

type Props = React.PropsWithChildren<{
  active?: boolean
}>

export const SmallButton = (props: Props) => {
  const theme = useTheme()

  return (
    <Typography
      component="button"
      sx={{
        color: props.active
          ? theme.palette.text.secondary
          : theme.palette.grey[500],
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: '200ms',
        background: 'none',
        margin: 0,
        textTransform: 'none',
        opacity: 1,
        minWidth: 'auto',
        padding: 0,
        border: 0,
        fontSize: theme.typography.caption,
        whiteSpace: 'nowrap',
        ':hover': {
          color: theme.palette.text.secondary,
        },
      }}
    >
      {props.children}
    </Typography>
  )
}
