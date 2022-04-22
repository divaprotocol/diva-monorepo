import styled from 'styled-components'
import { withStyles, makeStyles } from '@mui/styles'
import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/InfoOutlined'

export const LabelGrayStyle = styled.label`
  font-size: 16px;
`

export const LabelStyle = styled.label`
  font-size: 16px;
`
export const SubLabelStyle = styled.label`
  font-size: 8px;
  color: rgba(255, 255, 255, 0.7);
`

export const IconLabel = styled.label`
  width: 10px;
  height: 10px;
`

export const LabelStyleDiv = styled.div`
  width: 70%;
  height: 25px;
  padding: 10px;
  text-align: left;
`

export const FormDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-top: 15px;
  margin-bottom: 10px;
  margin-left: 20px;
  margin-right: 20px;
`

export const FormInput = styled.input`
  width: 30%;
  height: 25px;
  background-color: #f8f8f8;
  border: none;
  padding: 10px;
  text-align: right;
  font-size: 16px;
`

export const RightSideLabel = styled.div`
  width: 30%;
  height: 25px;
  border: none;
  padding: 10px;
  text-align: right;
  font-size: 16px;
`

export const RightSideGrayLabel = styled.div`
  width: 30%;
  height: 25px;
  border: none;
  padding: 10px;
  text-align: right;
  font-size: 22px;
`

export const FormControlDiv = styled.div`
  width: 30%;
  height: 25px;
  border: none;
  text-align: right;
  padding-top: 15px;
`

export const CreateButtonWrapper = styled.div`
  margin-top: 30px;
  margin-bottom: 10px;
  aligned: center;
`

export const LimitOrderExpiryDiv = styled.div`
  aligned: center;
  margin-top: -10px;
  font-size: 18px;
`

export const SliderDiv = styled.div`
  width: 60%;
  height: 25px;
  font-size: 24px;
  text-align: left;
`

export const useStyles = makeStyles((theme: any) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
  tab: {
    width: 100,
    minWidth: 50,
  },
  formControl: {
    minWidth: 115,
  },
  selectEmpty: {
    marginTop: theme.spacing(1),
  },
}))

export const ExpectedRateInfoText =
  'Rate is based on the current orderbook and may change at the time of execution. Use the slippage parameter to define your tolerance level.'
export const MaxSlippageText =
  'The maximum allowable change in price between order creation and execution.'

export const GrayText = styled.div`
  aligned: left;
  font-size: 16px;
  color: dimgray;
`
