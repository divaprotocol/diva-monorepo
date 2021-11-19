import React from 'react'
import styled from 'styled-components'
import logo_small from '../../Images/logo_small.svg'
import MenuItems from './MenuItems'
import ConnectWallet from '../Wallet/ConnectWalletButton'
import Typography from '@mui/material/Typography'

const Image = styled.img`
  height: 5vmin;
  margin-left: 20px;
  margin-right: 20px;
  pointer-events: none;
  width: 2.5%;
  height: 2.5%;
`

const AppHeader = styled.header`
  min-height: 5vh;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`

export default function Header() {
  return (
    <AppHeader>
      <Image src={logo_small} alt="ReactApp" />
      <MenuItems />
      <Typography
        variant="h5"
        noWrap
        component="div"
        sx={{ flexGrow: 1, alignSelf: 'flex-end' }}
      />
      <ConnectWallet />
    </AppHeader>
  )
}
