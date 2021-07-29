import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';


function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function MenuItems(props) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    props.handleTabClick(newValue)
  };

  return (
    <div>
        <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
          <Tab label="Markets" {...a11yProps(0)} />
          <Tab label="Trade" {...a11yProps(1)} />
          <Tab label="Request" {...a11yProps(2)} />
          <Tab label="Create" {...a11yProps(3)} />
        </Tabs>
    </div>
  );
}
