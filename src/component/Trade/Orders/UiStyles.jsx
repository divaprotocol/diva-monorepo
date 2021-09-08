import styled from 'styled-components';
import {createTheme, withStyles, makeStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import InfoIcon from '@material-ui/icons/InfoOutlined'


export const LabelGrayStyle = styled.label`
    font-size : 16px;
    color : gray;
`;

export const LabelStyle = styled.label`
    font-size : 16px;
`;

export const IconLabel = styled.label`
    width : 10px;
    height : 10px;
`

export const LabelStyleDiv = styled.div`
  width : 70%;
  height: 25px;
  color: #282c34;
  padding : 10px;
  text-align : left;
`;

export const FormDiv = styled.div`
  display : flex;
  flex-direction : row;
  justify-content: space-around;
  margin-top : 10px;
  margin-bottom : 10px;
  margin-left : 20px;
  margin-right : 20px;
`;

export const FormInput = styled.input`
    width : 30%;
    height: 25px;
    background-color: #F8F8F8;
    border : none;
    padding : 10px;
    text-align: right;
    font-size: 16px;
  `;

export  const RightSideLabel = styled.div`
  width : 30%;
  height: 25px;
  border : none;
  padding : 10px;
  text-align: right;
  font-size: 16px;
`

export const RightSideGrayLabel = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    padding : 10px;
    text-align: right;
    font-size: 22px;
    background-color: #F8F8F8;
  `

export const FormControlDiv = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    text-align: right;
    padding-top:15px;
  `;

export const CreateButtonWrapper = styled.div`
    margin-top : 40px;
    margin-bottom : 20px;
    aligned : center;
  `

export  const LimitOrderExpiryDiv = styled.div`
  aligned : center;
  color: #282c34;
  font-size : 18px;
`;

export const SliderDiv = styled.div`
  width : 60%;
  height: 25px;
  color: #282c34;
  font-size : 24px;
  text-align : left;
`;

export const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
    },
    tab: {
      width: 100,
      minWidth: 50
    },
    formControl: {
      minWidth:115,
    },
    selectEmpty: {
        marginTop: theme.spacing(1),
    }
  }));

export const InfoTooltip = withStyles((theme) => ({
    tooltip: {
      backgroundColor: '#f5f5f9',
      color: 'rgba(0, 0, 0, 0.87)',
      maxWidth: 220,
      fontSize: 12,
      border: '1px solid #dadde9',
    },
  }))(Tooltip);

  export const InfoIconStyle = withStyles((theme) => ({
    tooltip: {
      height:7,
      width:7,
      border: '1px solid #dadde9',
    },
  }))(InfoIcon);

export const ExpectedRateInfoText = "Rate is based on the current orderbook and may change at the time of execution. Use the slippage parameter to define your tolerance level."
export const MaxSlippageText = "The maximum allowable change in price between order creation and execution."