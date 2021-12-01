import { IconButton } from '@mui/material'
import { CopyToClipboardIcon } from './SvgIcons/CopyToClipboardIcon'

export function CopyToClipboard(textToCopy: string) {
  return (
    <IconButton onClick={() => navigator.clipboard.writeText(textToCopy)}>
      <CopyToClipboardIcon />
    </IconButton>
  )
}
