import { ExpandMoreOutlined } from '@mui/icons-material'
import {
  Accordion,
  Checkbox,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Box,
  FormControl,
  TextField,
  FormHelperText,
  FormControlLabel,
  Tooltip,
  Stack,
  Container,
  useTheme,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useCreatePoolFormik } from './formik'
import { ethers } from 'ethers'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'

export function DefineAdvanced({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const theme = useTheme()
  const userAddress = useAppSelector(selectUserAddress)
  const [expanded, setExpanded] = useState(false)
  const [unlimited, setUnlimited] = useState(true)
  const { capacity } = formik.values
  const [mobile, setMobile] = useState(false)
  const [editTaker, setEditTaker] = useState(false)
  const [editMaker, setEditMaker] = useState(false)
  useEffect(() => {
    formik.setFieldValue('longRecipient', userAddress)
    formik.setFieldValue('shortRecipient', userAddress)
  }, [userAddress])
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
  useEffect(() => {
    if (unlimited) {
      formik.setValues((_values) => ({
        ..._values,
        capacity: 'Unlimited',
      }))
    } else {
      formik.setValues((_values) => ({
        ..._values,
        capacity: formik.values.collateralBalance.toString(),
      }))
    }
  }, [unlimited, formik.values.collateralBalance])

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        maxWidth: !mobile ? '95%' : '48%',
        background: 'none',
        padding: 0,
        borderTop: 'none',
        ':before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreOutlined />}
        sx={{
          paddingLeft: 0,
        }}
      >
        <Typography color="primary" variant="subtitle2">
          Advanced Settings
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <Box pb={3}>
          <Stack direction={mobile ? 'column' : 'row'}>
            <Container sx={{ margin: -2, padding: 1 }}>
              <FormControl
                fullWidth
                error={formik.errors.minTakerContribution != null}
              >
                <Tooltip placement="top-end" title="Long Recipient Address">
                  <TextField
                    name="longRecipient"
                    error={formik.errors.longRecipient != null}
                    disabled={!editMaker}
                    onBlur={formik.handleBlur}
                    id="longRecipient"
                    label="Long Recipient"
                    value={formik.values.longRecipient}
                    helperText={
                      formik.errors.longRecipient != null
                        ? formik.errors.longRecipient
                        : ''
                    }
                    type="string"
                    onChange={(event) => {
                      formik.setFieldValue('longRecipient', event.target.value)
                    }}
                  />
                </Tooltip>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={editMaker}
                    onChange={() => {
                      formik.setFieldValue('longRecipient', userAddress)
                      setEditMaker(!editMaker)
                    }}
                  />
                }
                label="Edit"
              />
              <FormControl fullWidth error={formik.errors.capacity != null}>
                <Tooltip
                  placement="top-end"
                  title="Maximum collateral that the pool can accept."
                >
                  <TextField
                    name="capacity"
                    error={formik.errors.capacity != null}
                    disabled={unlimited}
                    onBlur={formik.handleBlur}
                    id="capacity"
                    label="Maximum Pool Capacity"
                    value={capacity}
                    helperText={
                      formik.errors.capacity != null
                        ? formik.errors.capacity
                        : ''
                    }
                    type="number"
                    onChange={formik.handleChange}
                  />
                </Tooltip>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={unlimited}
                    onChange={() => {
                      formik.setFieldValue('capacity', 'Unlimited')
                      setUnlimited(!unlimited)
                    }}
                  />
                }
                label="Unlimited"
              />
            </Container>
            <Container sx={{ margin: -3, padding: 2, pr: 4, ml: -1.5, mr: -8 }}>
              <FormControl fullWidth error={formik.errors.takerAddress != null}>
                <Tooltip placement="top-end" title="Short Recipient Address">
                  <TextField
                    name="shortRecipientAddress"
                    disabled={!editTaker}
                    id="shortRecipientAddress"
                    label="Short Recipient Address"
                    value={formik.values.shortRecipient}
                    onChange={(event) => {
                      formik.setFieldValue('shortRecipient', event.target.value)
                    }}
                    type="text"
                  />
                </Tooltip>
              </FormControl>
              <FormControlLabel
                sx={{ pb: theme.spacing(2) }}
                control={
                  <Checkbox
                    defaultChecked={editTaker}
                    onChange={() => {
                      setEditTaker(!editTaker)
                    }}
                  />
                }
                label="Edit"
              />
            </Container>
          </Stack>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
