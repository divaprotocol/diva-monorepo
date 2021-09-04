import React from 'react';
import styled from 'styled-components'
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import InputLabel from "@material-ui/core/InputLabel";
import { MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import InfoIcon from "@material-ui/icons/InfoOutlined"

const useStyles = makeStyles((theme) => ({
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

const FormDiv = styled.div`
  display : flex;
  flex-direction : row;
  justify-content: space-around;
  margin-top : 10px;
  margin-bottom : 10px;
  margin-left : 20px;
  margin-right : 20px;
`;

const LabelStyleDiv = styled.div`
    width : 70%;
    height: 25px;
    color: #282c34;
    padding : 10px;
    font-size : 24px;
    text-align : left;
  `;

const SliderDiv = styled.div`
  width : 60%;
  height: 25px;
  color: #282c34;
  font-size : 24px;
  text-align : left;
`;

  const FormInput = styled.input`
    width : 30%;
    height: 25px;
    background-color: #F8F8F8;
    border : none;
    padding : 10px;
    text-align: center;
    font-size: 26px;
  `;

  const RightSideLabel = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    padding : 10px;
    text-align: center;
    font-size: 22px;
  `

  const FormControlDiv = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    text-align: center;
    padding-top : 20px;
  `;
  
  const LableStyle = styled.label`
    font-size : 18px;
  `
  const LabelGrayStyle = styled.label`
    font-size : 18px;
    color : gray;
  `

  const CreateButtonWrapper = styled.div`
    margin-top : 40px;
    margin-bottom : 20px;
    aligned : center;
  `
export default function BuyMarket(props) {
  const classes = useStyles();
  const option = props.option
  const [value, setValue] = React.useState(30);
  const [numberOfOptions, setNumberOfOptions] = React.useState(5);
  const [pricePerOption, setPricePerOption] = React.useState(0);

  const handleNumberOfOptions = (value) => {
    setNumberOfOptions(value)
  }

  const handleOrderSubmit = async (event) => {}
  const handleExpirySelection = {}
  const handleSliderChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleInputChange = (event) => {
    setValue(event.target.value === "" ? "" : Number(event.target.value));
  };

  const handleBlur = () => {
    if (value < 0) {
      setValue(0);
    } else if (value > 100) {
      setValue(100);
    }
  };

  return(
    <div>
      <form onSubmit={handleOrderSubmit}>
      <FormDiv>
        <LabelStyleDiv><LableStyle>Number of Options</LableStyle></LabelStyleDiv>
        <FormInput type="text" value={numberOfOptions} onChange={event => handleNumberOfOptions(event.target.value)} />
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LableStyle>Expected Rate </LableStyle><InfoIcon/></LabelStyleDiv>
        <RightSideLabel>{pricePerOption} {option.CollateralTokenName}</RightSideLabel>
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LableStyle>You Pay</LableStyle></LabelStyleDiv>
        <RightSideLabel>{pricePerOption} {option.CollateralTokenName}</RightSideLabel>
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LabelGrayStyle>Wallet Balance</LabelGrayStyle></LabelStyleDiv>
        <RightSideLabel><LabelGrayStyle>{pricePerOption} {option.CollateralTokenName}</LabelGrayStyle></RightSideLabel>
      </FormDiv>
      <FormDiv> 
        <SliderDiv>
          <Typography id="input-slider" gutterBottom>
            <LabelGrayStyle>Max slippage%</LabelGrayStyle>
            <InfoIcon/>
          </Typography>
          
          <Slider
            value={typeof value === "number" ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
          />
        </SliderDiv>
        <FormControlDiv>
          <Input
            value={value}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: 10,
              min: 0,
              max: 100,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </FormControlDiv>
      </FormDiv>
      <CreateButtonWrapper/>
        <Button variant="contained"
          color="primary"
          size="large"
          className={classes.button}
          startIcon={<AddIcon />}
          type="submit"
        value="Submit"
        >
          Create Order
        </Button>
      </form>
    </div>
  );
}
