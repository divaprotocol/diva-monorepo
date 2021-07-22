import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';


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
}));

export default function MenuItems(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const optionData = props.optionData;

  const handleChange = (event, newValue) => {
    setValue(newValue);
    props.handleTabClick(newValue)
  };

  return (
    <div>
        <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Trade" {...a11yProps(1)} />
          <Tab label="Request" {...a11yProps(2)} />
          <Tab label="Create" {...a11yProps(3)} />
        </Tabs>
    </div>
  );
}
