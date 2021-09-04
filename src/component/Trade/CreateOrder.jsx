import React from 'react';
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import BuyMarket from './Orders/BuyMarket'
import BuyLimit from './Orders/BuyLimit';
import SellLimit from './Orders/SellLimit'
import SellMarket from './Orders/SellMarket'
const PageDiv = styled.div `
    width: 400px;
    height: 420px;
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
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 200,
    },
    selectEmpty: {
        marginTop: theme.spacing(1),
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

export default function CreateOrder(props) {
    const option = props.option
    const classes = useStyles();
    const dividerClass = useDividerStyle();
    const tabsClass = useTabsBorder();
    
    const [orderType, setOrderTypeValue] = React.useState(0);
    const [priceType, setPriceTypeValue] = React.useState(0);
    const [numberOfOptions, setNumberOfOptions] = React.useState(5);
    const [pricePerOption, setPricePerOption] = React.useState(0);

    const [expiry, setExpiry] = React.useState(5);

    const handleOrderTypeChange = (event, newValue) => {
      setOrderTypeValue(newValue);
    };

    const handlePriceTypeChange = (event, newValue) => {
      setPriceTypeValue(newValue);
    };

    const handleChange = () => {}

    const renderOrderInfo = () => {
      if(orderType == 0 && priceType == 0) {
        //Buy Market
        return(<BuyMarket option= {option}/>)
      }
      if(orderType == 0 && priceType == 1 ) {
        //Buy Limit
        return(<BuyLimit option= {option} />)
      }
      if(orderType == 1 && priceType == 0 ) {
        //Sell Market
        return(<SellMarket option= {option}/>)
      }
      if(orderType == 1 && priceType == 1) {
        //Sell Limit
        return(<SellLimit option= {option}/>)
      }
    }
    
    return(
      <PageDiv className={classes.root}>
        <TabsDiv>
          <LeftTabDiv>
            <Tabs className={tabsClass.tabs} value={orderType} onChange={handleOrderTypeChange} TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
              <Tab label="BUY" {...a11yProps(0)} className={classes.tab}/>
              <Tab label="SELL" {...a11yProps(1)} className={dividerClass.tab}/>
            </Tabs>
          </LeftTabDiv>
            
          <RightTabDiv>
            <Tabs className={tabsClass.tabs} value={priceType} onChange={handlePriceTypeChange} TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
              <Tab label="MARKET" {...a11yProps(0)} className={classes.tab}/>
              <Tab label="LIMIT" {...a11yProps(1)} className={classes.tab}/>
            </Tabs>
          </RightTabDiv>
        </TabsDiv>  
          {renderOrderInfo()}
      </PageDiv>
    ); 
}