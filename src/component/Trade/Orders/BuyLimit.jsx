import React from 'react';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import { MenuItem } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import InfoIcon from "@material-ui/icons/InfoOutlined"
import { buylimitOrder } from '../../../Orders/BuyLimit';
import { LabelStyle } from './UiStyles';
import { LabelGrayStyle } from './UiStyles';
import { LabelStyleDiv } from './UiStyles';
import { FormDiv } from './UiStyles';
import { FormInput } from './UiStyles';
import { RightSideLabel } from './UiStyles';
import { RightSideGrayLabel } from './UiStyles';
import { CreateButtonWrapper } from './UiStyles';
import { LimitOrderExpiryDiv } from './UiStyles';
import { useStyles } from './UiStyles';
import Web3 from 'web3'

const web3 = new Web3(Web3.givenProvider);
let accounts;
export default function BuyLimit(props) {
  const classes = useStyles();
  const option = props.option
  const [expiry, setExpiry] = React.useState(5);
  const [numberOfOptions, setNumberOfOptions] = React.useState(5);
  const [pricePerOption, setPricePerOption] = React.useState(0);

  const handleNumberOfOptions = (value) => {
    setNumberOfOptions(value)
  }

  const handlePricePerOptions = (value) => {
    setPricePerOption(value)
  }

  

  const handleExpirySelection = (event) => {
    event.preventDefault()
    setExpiry(event.target.value);
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    console.log(numberOfOptions)
    accounts = await window.ethereum.enable()
    const orderData = {
      maker : accounts[0],
      provider : web3,
      isBuy : true,
      nbrOptions : numberOfOptions,
      limitPrice : pricePerOption,
      orderExpiry : 8
    }
    buylimitOrder(orderData)
  }

  return(
    <div>
      <form onSubmit={handleOrderSubmit}>
      <FormDiv>
        <LabelStyleDiv><LabelStyle>Number of Options</LabelStyle></LabelStyleDiv>
        <FormInput type="text" value={numberOfOptions} onChange={event => handleNumberOfOptions(event.target.value)} />
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LabelStyle>Price per Option</LabelStyle></LabelStyleDiv>
        <FormInput type="text" value={pricePerOption} onChange={event => handlePricePerOptions(event.target.value)} />
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LabelStyle>You Pay</LabelStyle></LabelStyleDiv>
        <RightSideLabel>{pricePerOption * numberOfOptions} {option.CollateralTokenName}</RightSideLabel>
      </FormDiv>
      <FormDiv> 
        <LabelStyleDiv><LabelGrayStyle>Wallet Balance</LabelGrayStyle></LabelStyleDiv>
        <RightSideLabel><LabelGrayStyle>{} {option.CollateralTokenName}</LabelGrayStyle></RightSideLabel>
      </FormDiv>
      <FormDiv>
      <LabelStyleDiv><LabelGrayStyle>Order Expires in</LabelGrayStyle><InfoIcon style={{fontSize : 15}}/></LabelStyleDiv>
        <LimitOrderExpiryDiv>
          <FormControl className={classes.formControl}>
            <Select
              value={expiry}
              onChange={handleExpirySelection}
              displayEmpty
              className={classes.selectEmpty}
              inputProps={{ 'aria-label': 'Without label' }}
            >
              <MenuItem value={5} >
                <LabelGrayStyle>5 Minutes</LabelGrayStyle>
              </MenuItem>
              <MenuItem value={10}><LabelGrayStyle>10 Minutes</LabelGrayStyle></MenuItem>
              <MenuItem value={20}><LabelGrayStyle>20 Minutes</LabelGrayStyle></MenuItem>
              <MenuItem value={30}><LabelGrayStyle>30 Minutes</LabelGrayStyle></MenuItem>
              <MenuItem value={60}><LabelGrayStyle>1 Hour</LabelGrayStyle></MenuItem>
            </Select>
          </FormControl>
        </LimitOrderExpiryDiv>
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