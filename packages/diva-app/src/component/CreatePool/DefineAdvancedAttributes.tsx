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
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useCreatePoolFormik } from './formik'

export function DefineAdvanced({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const [expanded, setExpanded] = useState(false)
  const [unlimited, setUnlimited] = useState(true)
  const { tokenSupply, capacity } = formik.values
  const [mobile, setMobile] = useState(false)
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
        capacity: formik.values.collateralBalance,
      }))
    }
  }, [unlimited, formik.values.collateralBalance])

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        maxWidth: mobile ? '100%' : '48%',
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
                  formik.errors.capacity != null ? formik.errors.capacity : ''
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
                onChange={() => setUnlimited(!unlimited)}
              />
            }
            label="Unlimited"
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
