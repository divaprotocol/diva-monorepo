import React from 'react';
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AddIcon from '@material-ui/icons/Add';
import Button from '@material-ui/core/Button';

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
        margin-top : 25px;
        aligned : center;
        color: #282c34;
    `;

  const NumberLabelDiv = styled.div`
        width: 200px;
        height: 30px;
        margin-top : 25px;
        margin-left: 100px;
        align-items: center;
        display: flex;
        background-color: #F8F8F8;
        padding-top:10px;
        padding-bottom: 10px;
  `;

  const NumberLabel = styled.label`
    margin: 0 auto;
  `;

export default function CreateOrder() {
    const classes = useStyles();
    const dividerClass = useDividerStyle();
    const tabsClass = useTabsBorder();
    const [orderTypeValue, setOrderTypeValue] = React.useState(0);
    const [priceTypeValue, setPriceTypeValue] = React.useState(0);
    
    const orderData = {
        numberOfOptions : 10,
        youPay : 1.9,
        token : 'DAI'
    }

    const handleOrderTypeChange = (event, newValue) => {
      setOrderTypeValue(newValue);
    };

    const handlePriceTypeChange = (event, newValue) => {
      setPriceTypeValue(newValue);
    };

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
            <LabelStyleDiv><label>Number of Options</label></LabelStyleDiv>
            <NumberLabelDiv><NumberLabel>{orderData.numberOfOptions}</NumberLabel></NumberLabelDiv>
            <LabelStyleDiv><label>Price per Option</label></LabelStyleDiv>
            <NumberLabelDiv><NumberLabel>{orderData.numberOfOptions}</NumberLabel></NumberLabelDiv>
            <LabelStyleDiv><label>Order expires in 10 mins</label></LabelStyleDiv>
            <Button variant="contained"
            color="primary"
            size="large"
            className={classes.button}
            startIcon={<AddIcon />}
            >
            Create Order
        </Button>
        </PageDiv>
    ); 
}