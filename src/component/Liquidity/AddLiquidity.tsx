import { Container, Divider, Stack, TextField } from '@mui/material'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'
import { Pool } from '../../lib/queries'
import { useErcBalance } from '../../hooks/useErcBalance'
import { Contract, ethers } from 'ethers'
import styled from '@emotion/styled'
import ERC20 from '../../abi/ERC20.json'
import { chainIdtoName } from '../../Util/chainIdToName'
import { useWeb3React } from '@web3-react/core'
const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

type Props = {
  pool?: Pool
  diva?: Contract
}

export const AddLiquidity = ({ pool, diva }: Props) => {
  const { chainId, account } = useWeb3React()
  const [textFieldValue, setTextFieldValue] = useState('')
  const [balance, setBalance] = useState('')
  const tokenBalance = useErcBalance(pool ? pool!.collateralToken : undefined)
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId!).toLowerCase()
  )
  useEffect(() => {
    setBalance(tokenBalance!)
  }, [tokenBalance])
  return (
    <Stack
      direction="column"
      sx={{
        mt: '2em',
        // mr: '2em',
        // ml: '2em',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ mt: '1em' }}>Amount</Typography>
        <TextField
          value={textFieldValue}
          onChange={(e) => {
            setTextFieldValue(e.target.value)
          }}
        />
      </Stack>
      {tokenBalance ? (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            Your Balance: {balance}
            <MaxCollateral
              role="button"
              onClick={() => {
                if (tokenBalance != null) {
                  setTextFieldValue(tokenBalance)
                }
              }}
            >
              (Max)
            </MaxCollateral>
          </Typography>
        </>
      ) : (
        <Typography variant="subtitle2" color="text.secondary">
          Please connect your wallet
        </Typography>
      )}
      <Container
        sx={{
          mt: '1em',
          borderRadius: '16px',
          width: 450,
          height: 200,
          backgroundColor: 'darkgray',
          alignSelf: 'center',
        }}
      >
        <Container
          sx={{
            mt: '2em',
            paddingRight: '40px',
            // width: 240,
            // height: 120,
            backgroundColor: 'darkgray',
          }}
        >
          <Typography>You Recieve</Typography>
          <Divider
            variant={'fullWidth'}
            sx={{ background: 'white', mt: '1em', mb: '1em' }}
          />
          <Stack direction="row">
            <Container sx={{ minWidth: '100px' }}>
              <Typography>10.00</Typography>
              <Typography>Long Tokens</Typography>
            </Container>
            <Container sx={{ minWidth: '100px' }}>
              <Typography>10.00</Typography>
              <Typography>Short Tokens</Typography>
            </Container>
            <Container sx={{ minWidth: '100px' }}>
              <Typography>NaN%</Typography>
              <Typography>Share of Pool</Typography>
            </Container>
          </Stack>
        </Container>
      </Container>
      <Container
        sx={{
          mt: '2em',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            type="submit"
            value="Submit"
            disabled={!pool}
            onClick={() => {
              console.log(ethers.utils.parseEther(textFieldValue))

              const token = new ethers.Contract(
                pool!.collateralToken,
                ERC20,
                provider.getSigner()
              )
              token
                .approve(diva?.address, ethers.utils.parseEther(textFieldValue))
                .then((tx: any) => {
                  tx.wait().then(() => {
                    token.allowance(account, diva?.address).then((tx: any) => {
                      diva!.addLiquidity(
                        window.location.pathname.split('/')[1],
                        ethers.utils.parseEther(textFieldValue)
                      )
                    })
                  })
                })
              // tx!.wait().then(() => {
              //   const tx = token.allowance(account, diva?.address)
              //   tx!.wait().then(() => {
              //     diva!.addLiquidity(
              //       window.location.pathname.split('/')[1],
              //       ethers.utils.parseEther(textFieldValue)
              //     )
              //   })
              // })
              // token
              //   .approve(diva?.address, ethers.utils.parseEther(textFieldValue))
              //   .then(() => {
              //     token.allowance(account, diva?.address)
              //   })
              //   .then(() => {
              //     diva!.addLiquidity(
              //       window.location.pathname.split('/')[1],
              //       ethers.utils.parseEther(textFieldValue)
              //     )
              //   })
            }}
            style={{
              maxWidth: '300px',
              maxHeight: '40px',
              minWidth: '300px',
              minHeight: '40px',
            }}
          >
            Add
          </Button>
        </div>
      </Container>
    </Stack>
  )
}
