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
    shortTokenSupply,
    longTokenSupply,
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
          <FormControl fullWidth error={formik.errors.shortTokenSupply != null}>
            <TextField
              name="shortTokenSupply"
              id="shortTokenSupply"
              onBlur={formik.handleBlur}
              error={formik.errors.shortTokenSupply != null}
              label="Short Token Supply"
              value={shortTokenSupply}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.shortTokenSupply != null && (
              <FormHelperText>{formik.errors.shortTokenSupply}</FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.longTokenSupply != null}>
            <TextField
              name="longTokenSupply"
              error={formik.errors.longTokenSupply != null}
              onBlur={formik.handleBlur}
              id="longTokenSupply"
              label="Long Token Supply"
              value={longTokenSupply}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.longTokenSupply != null && (
              <FormHelperText>{formik.errors.longTokenSupply}</FormHelperText>
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
              helperText="A value of 0 means no limit is imposed."
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.capacity != null && (
              <FormHelperText>{formik.errors.capacity}</FormHelperText>
            )}
          </FormControl>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
