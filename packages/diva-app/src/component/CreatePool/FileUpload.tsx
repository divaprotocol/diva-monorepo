import React from 'react'
import { Box, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { makeStyles } from '@mui/styles'

export type FileUploadProps = {
  imageButton?: boolean
  accept: string
  hoverLabel?: string
  dropLabel?: string
  width?: string
  height?: string
  backgroundColor?: string
  image?: {
    url: string
    imageStyle?: {
      width?: string
      height?: string
    }
  }
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: React.DragEvent<HTMLElement>) => void
}

const useStyle = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
}))

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  imageButton = false,
  hoverLabel = 'Click or drag to upload file',
  dropLabel = 'Drop file here',
  width = '100%',
  height = '300px',
  backgroundColor = '#121212',
  onChange,
  onDrop,
}) => {
  const classes = useStyle()
  const [importedJson, setImportedJson] = React.useState({})
  const [labelText, setLabelText] = React.useState<string>(hoverLabel)
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false)
  const [isMouseOver, setIsMouseOver] = React.useState<boolean>(false)
  const stopDefaults = (e: React.DragEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }
  const dragEvents = {
    onMouseEnter: () => {
      setIsMouseOver(true)
    },
    onMouseLeave: () => {
      setIsMouseOver(false)
    },
    onDragEnter: (e: React.DragEvent) => {
      stopDefaults(e)
      setIsDragOver(true)
      setLabelText(dropLabel)
    },
    onDragLeave: (e: React.DragEvent) => {
      stopDefaults(e)
      setIsDragOver(false)
      setLabelText(hoverLabel)
    },
    onDragOver: stopDefaults,
    onDrop: (e) => {
      stopDefaults(e)
      setLabelText(hoverLabel)
      setIsDragOver(false)
      onDrop(e)
    },
  }

  return (
    <>
      <input
        onChange={onChange}
        accept={accept}
        className={classes.hidden}
        id="file-upload"
        type="file"
      />

      <label htmlFor="file-upload" {...dragEvents}>
        <Box width={width} height={height} bgcolor={backgroundColor}>
          {(!imageButton || isDragOver || isMouseOver) && (
            <>
              <Box
                height={height}
                width={width}
                border={1}
                borderColor="secondary.dark"
              >
                <CloudUploadIcon
                  fontSize="large"
                  sx={{ ml: '50%', mt: '9%' }}
                />
                <Typography sx={{ ml: '45%' }}>{labelText}</Typography>
              </Box>
            </>
          )}
        </Box>
      </label>
    </>
  )
}
