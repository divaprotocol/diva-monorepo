import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import {
  BrowserRouter as Router,
  Route,
  Link  
} from "react-router-dom";

export default function MenuItems() {
  return (
    <div>
      <Route 
        path="/"
        render={(history) => (
          <Tabs value={history.location.pathname.includes('/trade') ? false : history.location.pathname } aria-label="simple tabs example" TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
            <Tab label="Markets" value={"/"} component={Link} to={"/"}/>
            <Tab label="Request" value={"/Request"} component={Link} to={"/Request"}/>
            <Tab label="Create" value={"/Create"} component={Link} to={"/Create"}/> 
        </Tabs>
        )} 
      />
    </div>
  );
}

//<Tab label="Trade" {...a11yProps(1)} /> 
/**
 * 
 * <Tab label="Markets"  value={"/market"} component={Link} to={"/market"}/>
            <Tab label="Request"  value={"/Request"} component={Link} to={"/Request"}/>
            <Tab label="Create" value={"/Create"} component={Link} to={"/Create"}/>
            
 * 
 * <Tabs value={value} onChange={handleChange} aria-label="simple tabs example" TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
 * <Tab label="Markets" {...a11yProps(0)} component={Link} to={"/market"}/>
          <Tab label="Request" {...a11yProps(1)} component={Link} to={"/trade/:id"}/>
          <Tab label="Create" {...a11yProps(2)} component={Link} to={"/Create"}/>
 * 
 * return (
    <div>
        <Tabs value={value} onChange={handleChange} aria-label="simple tabs example" TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
          <Tab label="Markets" {...a11yProps(0)} />
          <Tab label="Request" {...a11yProps(1)} />
          <Tab label="Create" {...a11yProps(2)} />
        </Tabs>
    </div>
  );
 */