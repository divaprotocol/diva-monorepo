import { Search } from '@mui/icons-material'
import {
  Box,
  Accordion,
  AccordionSummary,
  Typography,
  AccordionDetails,
  TextField,
  InputAdornment,
  Divider,
  Stack,
  useTheme,
  Checkbox,
  Switch,
} from '@mui/material'
import { useMemo } from 'react'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'

import { getTopNObjectByProperty } from '../../Util/dashboard'
import { DEFAULT_MARKETS_CREATED_BY } from '../../constants'

const FilterAccordion = ({ title, children }) => {
  const theme = useTheme()

  return (
    <Accordion
      sx={{
        backgroundColor: '#000000',
        '&:before': {
          display: 'none',
        },
        marginTop: theme.spacing(3.5),
        marginBottom: theme.spacing(1),
      }}
      defaultExpanded
    >
      <AccordionSummary
        aria-controls="panel1a-content"
        id="panel1a-header"
        sx={{
          padding: '0px',
          backgroundColor: '#000000',
        }}
        expandIcon={<ArrowDropUpIcon />}
      >
        <Typography
          sx={{
            fontSize: '16px',
          }}
        >
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          backgroundColor: '#000000',
          padding: 0,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  )
}

export const MobileFilterOptions = ({
  setSearch,
  expiredPoolClicked,
  setExpiredPoolClicked,
  rows,
  checkedState,
  setCheckedState,
  searchInput,
  setSearchInput,
  createdBy,
  setCreatedBy,
  handleCreatorInput,
  handleSellPriceFilter,
  sellPriceFilter,
  handleBuyPriceFilter,
  buyPriceFilter,
  idInput,
  handleIdFilterChange,
  handleWhitelistFilter,
  whitelistFilter,
}) => {
  const theme = useTheme()

  const top4UnderlyingTokens = useMemo(
    () => getTopNObjectByProperty(rows, 'Underlying', 4),
    [rows]
  )

  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    )

    setCheckedState(updatedCheckedState)

    // create a string of tokens that should be included in the search
    const underlyingTokenString = updatedCheckedState
      .map((currentState, index) => {
        if (currentState === true) {
          return top4UnderlyingTokens[index]
        }
      })
      .filter((item) => item !== undefined)
      .map((item) => item.token)
      .join(' ')
      .toString()

    setSearch(underlyingTokenString)
  }

  return (
    <Box
      sx={{
        overflowY: 'scroll',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <FilterAccordion title="Asset Id">
        <Box>
          <TextField
            value={idInput}
            aria-label="Filter creator"
            sx={{
              width: '100%',
              height: theme.spacing(6.25),
              marginTop: theme.spacing(2),
            }}
            onChange={handleIdFilterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="secondary" />
                </InputAdornment>
              ),
            }}
            placeholder="Enter Asset Id"
            color="secondary"
          />
        </Box>
      </FilterAccordion>
      <Divider />

      <FilterAccordion title="Creator">
        <Box>
          <TextField
            value={createdBy}
            aria-label="Filter creator"
            sx={{
              width: '100%',
              height: theme.spacing(6.25),
              marginTop: theme.spacing(2),
            }}
            onChange={handleCreatorInput}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="secondary" />
                </InputAdornment>
              ),
            }}
            placeholder="Enter Creator"
            color="secondary"
          />
        </Box>
        <Stack
          spacing={0.6}
          sx={{
            marginTop: theme.spacing(2),
            fontSize: '14px',
          }}
        >
          <Stack
            direction="row"
            justifyContent={'space-between'}
            alignItems={'center'}
          >
            <Box>Diva Governance</Box>
            <Checkbox
              checked={createdBy === DEFAULT_MARKETS_CREATED_BY}
              id={`checkbox-diva-governance`}
              onChange={() => {
                if (createdBy === DEFAULT_MARKETS_CREATED_BY) {
                  setCreatedBy('')
                } else {
                  setCreatedBy(DEFAULT_MARKETS_CREATED_BY)
                }
              }}
            />
          </Stack>
        </Stack>
      </FilterAccordion>

      <Divider />

      <FilterAccordion title="Underlying">
        <Box>
          <TextField
            value={searchInput}
            aria-label="Filter creator"
            sx={{
              width: '100%',
              height: theme.spacing(6.25),
              marginTop: theme.spacing(2),
            }}
            onChange={(event) => setSearchInput(event.target.value)}
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
        <Stack
          spacing={0.6}
          sx={{
            marginTop: theme.spacing(2),
            fontSize: '14px',
          }}
        >
          {top4UnderlyingTokens.map((underlying, index) => (
            <Stack
              direction="row"
              justifyContent={'space-between'}
              alignItems={'center'}
              key={index}
            >
              <Box>{underlying.token}</Box>
              <Checkbox
                checked={checkedState[index]}
                id={`custom-checkbox-${index}`}
                onChange={() => handleOnChange(index)}
              />
            </Stack>
          ))}
        </Stack>
      </FilterAccordion>

      <Divider />
      <Stack
        sx={{
          paddingTop: theme.spacing(2.5),
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Whitelisted Oracle</Box>
          <Switch checked={whitelistFilter} onChange={handleWhitelistFilter} />
        </Stack>
      </Stack>
      <Divider />
      <Stack
        sx={{
          paddingTop: theme.spacing(2.5),
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Hide Expired Pools</Box>
          <Switch
            checked={expiredPoolClicked}
            onChange={() => setExpiredPoolClicked(!expiredPoolClicked)}
          />
        </Stack>
      </Stack>
      <Divider />
      <Stack
        sx={{
          paddingTop: theme.spacing(2.5),
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Has Buy Price</Box>
          <Switch checked={buyPriceFilter} onChange={handleBuyPriceFilter} />
        </Stack>
      </Stack>
      <Divider />
      <Stack
        sx={{
          paddingTop: theme.spacing(2.5),
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Has Sell Price</Box>
          <Switch checked={sellPriceFilter} onChange={handleSellPriceFilter} />
        </Stack>
      </Stack>
    </Box>
  )
}
