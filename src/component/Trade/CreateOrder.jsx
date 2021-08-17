import React from 'react';
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';
import EditRoundedIcon from '@material-ui/icons/EditRounded';

const PageDiv = styled.div `
    width: 400px;
    height: 400px;
`;

function a11yProps(index) {
    return {
      id: `tab-${index}`,
      'aria-controls': `tabpanel-${index}`,
    };
  }
  
  const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
    tab: {
        width: 100,
        minWidth: 50
      }
  }));

  const TabsDiv = styled.div`
    display: flex;
    justify-content: space-around;
    aligh-items: flex-start;
  `;

  const LeftTabDiv = styled.div`
    flex : 1;
  `;

  const RightTabDiv = styled.div`
    flex : 1;
  `;

  const useDividerStyle = makeStyles((theme) => ({
    tab: {
        width: 100,
        minWidth: 50,
        borderRight: '1px solid #cccccc',
      }
  }));

  const useTabsBorder = makeStyles((theme) => ({
    tabs: {
        borderBottom: '1px solid #cccccc',
      }
  }));

  const LabelStyleDiv = styled.div`
    margin-top : 20px;
    margin-bottom : 20px;
    aligned : center;
    color: #282c34;
    font-size : 18px;
  `;

  const CreateButtonWrapper = styled.div`
    margin-top : 20px;
    margin-bottom : 20px;
    aligned : center;
  `
  
  const ExpiryLabel = styled.label`
    margin-right : 10px;
  `;

  const FormInput = styled.input`
    width: 200px;
    height: 30px;
    margin-top : 25px;
    margin-left: 100px;
    display: flex;
    background-color: #F8F8F8;
    padding-top:10px;
    padding-bottom: 10px;
    font-size : 36px;
    border : none;
    text-align : center;
  `

export default function CreateOrder(props) {
    const classes = useStyles();
    const dividerClass = useDividerStyle();
    const tabsClass = useTabsBorder();
    
    const [orderTypeValue, setOrderTypeValue] = React.useState(0);
    const [priceTypeValue, setPriceTypeValue] = React.useState(0);
    const [numberOfOptions, setNumberOfOptions] = React.useState(5);
    const [pricePerOption, setPricePerOption] = React.useState(0)
    

    const handleOrderTypeChange = (event, newValue) => {
      setOrderTypeValue(newValue);
    };

    const handlePriceTypeChange = (event, newValue) => {
      setPriceTypeValue(newValue);
    };

    const handleOrderSubmit = (event) => {
      event.preventDefault();
    }
    return(
      <PageDiv className={classes.root}>
        <TabsDiv>
          <LeftTabDiv>
            <Tabs className={tabsClass.tabs} value={orderTypeValue} onChange={handleOrderTypeChange} aria-label="simple tabs example">
              <Tab label="BUY" {...a11yProps(0)} className={classes.tab}/>
              <Tab label="SELL" {...a11yProps(1)} className={dividerClass.tab}/>
            </Tabs>
          </LeftTabDiv>
            
          <RightTabDiv>
            <Tabs className={tabsClass.tabs} value={priceTypeValue} onChange={handlePriceTypeChange} aria-label="simple tabs example">
              <Tab label="MARKET" {...a11yProps(0)} className={classes.tab}/>
              <Tab label="LIMIT" {...a11yProps(1)} className={classes.tab}/>
            </Tabs>
          </RightTabDiv>
        </TabsDiv>  
        
        <form onSubmit={handleOrderSubmit}>
          <LabelStyleDiv><label>Number of Options</label></LabelStyleDiv>
            <FormInput type="text" value={numberOfOptions} onChange={ event => setNumberOfOptions(event.target.value)} />
          <LabelStyleDiv><label>Price per Option in {props.collateral}</label></LabelStyleDiv>
            <FormInput type="text" value={pricePerOption} onChange={event =>  setPricePerOption(event.target.value)}/>
          <LabelStyleDiv hidden={priceTypeValue===0}>
            <ExpiryLabel>Order expires in 10 mins</ExpiryLabel>
            <EditRoundedIcon aria-label="edit"/>
          </LabelStyleDiv>
          <CreateButtonWrapper hidden={priceTypeValue===1}/>
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
      </PageDiv>
    ); 
}