import { Search } from '@mui/icons-material'
import {
  Drawer,
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import CloseIcon from '@mui/icons-material/Close'

export const FilterDrawerModal = ({
  isFilterDrawerOpen,
  setIsFilterDrawerOpen,
  children,
  search,
  setSearch,
  onApplyFilter,
  onClearFilter,
}) => {
  return (
    <Drawer
      anchor={'bottom'}
      open={isFilterDrawerOpen}
      onClose={() => setIsFilterDrawerOpen(false)}
      sx={{}}
    >
      <Box
        sx={{
          height: '100vh',
          backgroundColor: '#000000',
          padding: '30px',
          position: 'relative',
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: 'relative',
          }}
        >
          <Box
            sx={{
              fontSize: '20px',
              fontWeight: '500',
              letterSpacing: '0.15px',
            }}
          >
            Filters
          </Box>
          <Box
            sx={{
              position: 'absolute',
              right: '5px',
              width: '14px',
              top: '2px',
            }}
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </Box>
        </Stack>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            marginTop: '38px',
          }}
        >
          <Typography
            sx={{
              fontSize: '16px',
            }}
          >
            Underlying
          </Typography>
          <ArrowDropUpIcon />
        </Stack>
        <Box>
          <TextField
            value={search}
            aria-label="Filter creator"
            sx={{ width: '100%', height: '50px', marginTop: '16px' }}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="secondary" />
                </InputAdornment>
              ),
            }}
            placeholder="Enter Underlying"
            color="secondary"
          />
        </Box>
        {children}
        <Box
          sx={{
            position: 'absolute',
            width: '84%',
            bottom: '50px',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{
              justifySelf: 'flex-end',
            }}
          >
            <Button
              variant="outlined"
              color="secondary"
              sx={{
                width: '124px',
                height: '42px',
              }}
              onClick={onClearFilter}
            >
              CLEAR ALL
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{
                width: '124px',
                height: '42px',
              }}
              onClick={onApplyFilter}
            >
              APPLY
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  )
}
