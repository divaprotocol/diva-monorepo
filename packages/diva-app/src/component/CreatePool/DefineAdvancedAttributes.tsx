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
  const {
    gradient,
    collateralBalanceShort,
    tokenSupply,
    collateralBalanceLong,
    capacity,
  } = formik.values

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
        <Typography variant="subtitle2">Advanced Settings</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.gradient != null}>
            <Tooltip
              placement="top-end"
              title="Payout of long token at inflection. Short token payout at inflection is 1-Gradient."
            >
              <TextField
                name="gradient"
                id="gradient"
                label="Gradient"
                onBlur={formik.handleBlur}
                error={formik.errors.gradient != null}
                inputProps={{ min: 0 }}
                onChange={formik.handleChange}
                value={gradient}
                type="number"
              />
            </Tooltip>

            {formik.errors.gradient != null && (
              <FormHelperText>{formik.errors.gradient}</FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl
            fullWidth
            error={formik.errors.collateralBalanceShort != null}
          >
            <TextField
              disabled
              name="collateralBalanceShort"
              id="collateralBalanceShort"
              label="Short Pool Balance"
              onBlur={formik.handleBlur}
              error={formik.errors.collateralBalanceShort != null}
              inputProps={{ min: 0 }}
              onChange={formik.handleChange}
              value={collateralBalanceShort}
              type="number"
            />
            {formik.errors.collateralBalanceShort != null && (
              <FormHelperText>
                {formik.errors.collateralBalanceShort}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl
            fullWidth
            error={formik.errors.collateralBalanceLong != null}
          >
            <TextField
              disabled
              name="collateralBalanceLong"
              id="collateralBalanceLong"
              label="Long Pool Balance"
              onBlur={formik.handleBlur}
              error={formik.errors.collateralBalanceLong != null}
              inputProps={{ min: 0 }}
              value={collateralBalanceLong}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.collateralBalanceLong != null && (
              <FormHelperText>
                {formik.errors.collateralBalanceLong}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.tokenSupply != null}>
            <TextField
              name="Position Token Supply"
              id="tokenSupply"
              onBlur={formik.handleBlur}
              error={formik.errors.tokenSupply != null}
              label="Position Token Supply"
              value={tokenSupply}
              disabled
              type="number"
              inputProps={{ readOnly: true }}
            />
            {formik.errors.tokenSupply != null && (
              <FormHelperText>{formik.errors.tokenSupply}</FormHelperText>
            )}
          </FormControl>
        </Box>
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
