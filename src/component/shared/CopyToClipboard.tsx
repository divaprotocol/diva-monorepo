import { IconButton } from '@mui/material'
import Copy from '@mui/icons-material/ContentCopy'

export function CopyToClipboard(textToCopy: string) {
  return (
    <IconButton onClick={() => navigator.clipboard.writeText(textToCopy)}>
      <Copy />
    </IconButton>
  )
}
