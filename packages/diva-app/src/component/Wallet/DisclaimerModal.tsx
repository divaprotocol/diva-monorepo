import {
  DialogContent,
  DialogActions,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import SelectorModal from '../Header/SelectorModal'
import { useState } from 'react'

const useStyles = makeStyles((theme) => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '@media (max-width: 600px)': {
      padding: '0',
    },
  },
  disclaimerText: {
    opacity: 0.8,
  },
  button: {
    width: '100%',
  },
}))

const DisclaimerModal = ({ isOpen, onAgree, onDisagree }) => {
  const classes = useStyles()
  const isMobile = useMediaQuery('sm')
  const [isNotUSCitizen, setIsNotUSCitizen] = useState(false)

  const handleCheckboxChange = (event) => {
    setIsNotUSCitizen(event.target.checked)
  }

  const handleAgree = () => {
    if (isNotUSCitizen) {
      onAgree()
    } else {
      // Handle situation when user has not confirmed as non-US citizen
    }
  }

  return (
    <SelectorModal onClose={onDisagree} isOpen={isOpen} header={'Disclaimer'}>
      <DialogContent
        className={classes.dialogContent}
        sx={{
          padding: '8px',
        }}
      >
        <Typography
          id="disclaimer-dialog-description"
          className={classes.disclaimerText}
          marginBottom="16px"
        >
          Disclaimer text
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={isNotUSCitizen}
              onChange={handleCheckboxChange}
            />
          }
          label="I confirm that I am not a US citizen"
        />
      </DialogContent>
      <DialogActions
        sx={{
          padding: '0px',
        }}
      >
        <Button
          onClick={onDisagree}
          color="secondary"
          className={isMobile && classes.button}
        >
          Disagree
        </Button>
        <Button
          onClick={handleAgree}
          color="primary"
          autoFocus
          disabled={!isNotUSCitizen}
          className={isMobile && classes.button}
        >
          Agree
        </Button>
      </DialogActions>
    </SelectorModal>
  )
}

DisclaimerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onAgree: PropTypes.func.isRequired,
  onDisagree: PropTypes.func.isRequired,
}

export default DisclaimerModal
