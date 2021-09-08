import React from 'react';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import InfoIcon from "@material-ui/icons/InfoOutlined"
import { LabelStyle } from './UiStyles';
import { LabelGrayStyle } from './UiStyles';
import { LabelStyleDiv } from './UiStyles';
import { FormDiv } from './UiStyles';
import { FormInput } from './UiStyles';
import { RightSideLabel } from './UiStyles';
import { FormControlDiv } from './UiStyles';
import { CreateButtonWrapper } from './UiStyles';
import { SliderDiv } from './UiStyles';
import { useStyles } from './UiStyles';
import { InfoTooltip } from './UiStyles';
import { MaxSlippageText } from './UiStyles';
import { ExpectedRateInfoText } from './UiStyles';

export default function SellMarket(props) {
const classes = useStyles();
const option = props.option
const [value, setValue] = React.useState(0);
const [numberOfOptions, setNumberOfOptions] = React.useState(5);
const [pricePerOption, setPricePerOption] = React.useState(0);

const handleNumberOfOptions = (newValue) => {
  setNumberOfOptions(newValue)
}
  
const handleOrderSubmit = async (event) => {}
  
  
const handleSliderChange = (event, newValue) => {
  setValue(newValue);
};

const handleInputChange = (event) => {
  setValue(event.target.value === "" ? "" : Number(event.target.value));
};

const handleBlur = () => {
  if (value < 0) {
    setValue(0);
  } else if (value >= 20) {
    setValue(20);
  }
};

return(
  <div>
    <form onSubmit={handleOrderSubmit}>
      <FormDiv>
        <LabelStyleDiv><LabelStyle>Number of Options</LabelStyle></LabelStyleDiv>
        <FormInput type="text" value={numberOfOptions} onChange={event => handleNumberOfOptions(event.target.value)} />
      </FormDiv>
      <FormDiv> 
      <InfoTooltip
        title={
          <React.Fragment>
            {ExpectedRateInfoText}
          </React.Fragment>
        }
      >
        <LabelStyleDiv><LabelStyle>Expected Rate </LabelStyle><InfoIcon style={{fontSize : 15}}/></LabelStyleDiv>
      </InfoTooltip>
        <RightSideLabel>{pricePerOption} {option.CollateralTokenName}</RightSideLabel>
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LabelStyle>You Receive</LabelStyle></LabelStyleDiv>
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
            <InfoTooltip
              title={
                <React.Fragment>
                  {MaxSlippageText}
                </React.Fragment>
              }>
              <InfoIcon style={{fontSize : 15}}/>
            </InfoTooltip>
          </Typography>
          
          <Slider
            value={typeof value === "number" ? value : 0}
            onChange={handleSliderChange}
            step={0.1}
            min={0}
            max={20}
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
              step: 0.1,
              min: 0.0,
              max: 20,
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
