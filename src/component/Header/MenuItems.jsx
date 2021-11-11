import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {
  Route,
  Link  
} from "react-router-dom";

export default function MenuItems() {
  return (
    <div>
      <Route
        path="/"
        render={(history) => (
          <Tabs
            indicatorColor="primary"
            textColor="inherit"
            value={
              history.location.pathname.includes("/trade")
                ? false
                : history.location.pathname
            }
            aria-label=""
            TabIndicatorProps={{ style: { backgroundColor: "#70D9BA" } }}
          >
            <Tab label="Markets" value={"/"} component={Link} to={"/"} />
            <Tab
              label="Request"
              value={"/Request"}
              component={Link}
              to={"/Request"}
            />
            <Tab
              label="Create"
              value={"/Create"}
              component={Link}
              to={"/Create"}
            />
          </Tabs>
        )}
      />
    </div>
  );
}