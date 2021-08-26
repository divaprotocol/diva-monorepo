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
          <Tabs value={history.location.pathname.includes('/trade') ? false : history.location.pathname } aria-label="" TabIndicatorProps={{style: {backgroundColor: "#70D9BA"}}}>
            <Tab label="Markets" value={"/"} component={Link} to={"/"}/>
            <Tab label="Request" value={"/Request"} component={Link} to={"/Request"}/>
            <Tab label="Create" value={"/Create"} component={Link} to={"/Create"}/> 
        </Tabs>
        )} 
      />
    </div>
  );
}