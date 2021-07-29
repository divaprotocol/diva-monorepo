import React from 'react'
import InputBase from '@material-ui/core/InputBase';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import 'styled-components';
import styled from 'styled-components';


const PageDiv = styled.div`
  margin-left:0%;
  margin-right:0%;
  margin-top:2%;
  margin-bottom: 10px;
`;

const useStyles = makeStyles((theme) => ({
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
}));

export default function Search() {
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
            />
          </div>
    </PageDiv>
    );
}