import React from 'react'
import InputBase from '@mui/material/InputBase';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';
import 'styled-components';
import styled from 'styled-components';


const PageDiv = styled.div`
  margin-left:0%;
  margin-right:0%;
  margin-top:2%;
  margin-bottom: 10px;
`;

const useStyles = makeStyles((theme) => {
  console.log(theme)

  return {
  search: {
    position: 'relative',
    border : '1px solid #cccccc',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'white',
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 500,
    },
  },
  
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
    
  inputRoot: {
    color: 'inherit',
  },
    
  inputInput: {
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '20ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}});

export default function Search(props) {
    const classes = useStyles();
    
    return(
        <PageDiv>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder="Search by underlying..."
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'search' }}
              onChange={props.searchRow}
            />
          </div>
    </PageDiv>
    );
}