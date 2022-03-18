import { ExpandMoreOutlined } from '@mui/icons-material'
import {
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  Box,
  FormControl,
  TextField,
  FormHelperText,
} from '@mui/material'
import { useState } from 'react'
import { useCreatePoolFormik } from './formik'

export function DefineAdvanced({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const [expanded, setExpanded] = useState(false)

  const {
    collateralBalanceShort,
    tokenSupply,
    collateralBalanceLong,
    capacity,
  } = formik.values

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
          <FormControl
            fullWidth
            error={formik.errors.collateralBalanceShort != null}
          >
            <TextField
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
              name="tokenSupply"
              id="tokenSupply"
              onBlur={formik.handleBlur}
              error={formik.errors.tokenSupply != null}
              label="Position Token Supply"
              value={tokenSupply}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.tokenSupply != null && (
              <FormHelperText>{formik.errors.tokenSupply}</FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.capacity != null}>
            <TextField
              name="capacity"
              error={formik.errors.capacity != null}
              onBlur={formik.handleBlur}
              id="capacity"
              label="Maximum Pool Capacity"
              value={capacity}
              helperText={
                formik.errors.capacity != null
                  ? formik.errors.capacity
                  : 'A value of 0 means no limit is imposed.'
              }
              type="number"
              onChange={formik.handleChange}
            />
          </FormControl>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
