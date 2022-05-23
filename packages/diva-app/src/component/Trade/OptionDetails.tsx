import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates'
import { Tooltip } from '@mui/material'
import { Pool } from '../../lib/queries'
import { formatEther, formatUnits, parseUnits } from 'ethers/lib/utils'
import { useWhitelist } from '../../hooks/useWhitelist'
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp'
import WarningAmberSharpIcon from '@mui/icons-material/WarningAmberSharp'
import { BigNumber } from 'ethers'
const PageDiv = styled.div`
  width: 100%;
`

const HeaderDiv = styled.div`
  width: 100%;
  border-bottom: 1px solid rgba(224, 224, 224, 1);
  text-align: left;
  padding-bottom: 15px;
`

const HeaderLabel = styled.label`
  font-size: 1rem;
  font-weight: bold;
  margin-left: 15px;
`

const FlexBoxHeader = styled.div`
  font-size: 0.9rem;
  font-weight: solid;
  text-align: left;
  padding-left: 15px;
  color: gray;
`

const FlexBoxData = styled.div`
  padding: 15px;
  width: 100%;
  font-size: 1rem;
  font-weight: bold;
  text-align: left;
`

const FlexDiv = styled.div`
  margin-top: 15px;
  display: -webkit-box;
  display: -moz-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`

const FlexBox = styled.div`
  flex: 1;
  justify-content: flex-start;
`

const FlexSecondLineDiv = styled.div`
  width: 50%;
  margin-top: 15px;
  display: -webkit-box;
  display: -moz-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`

const FlexBoxSecondLine = styled.div`
  width: 100%;
  flex: 1;
`

const FlexBoxTime = styled.div`
  padding-top: 5.6px;
  font-size: 0.687rem;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  color: Gray;
`

const FlexBoxSecondLineData = styled.div`
  padding: 15px;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`
const FlexCheckIcon = styled.div`
  display: flex;
  flex-direction: row;
`
export default function OptionDetails({
  pool,
  isLong,
}: {
  pool: Pool
  isLong: boolean
}) {
  //Instead of calling redux to get selected option at each component level
  //we can call at root component of trade that is underlying and pass as porps
  //to each child component.
  const dataSource = useWhitelist()
  const [dataSourceName, setDataSourceName] = useState('')
  const [checkIcon, setCheckIcon] = useState(true)
  useEffect(() => {
    const dataName = dataSource?.dataProviders?.find(
      (dataName: { id: string }) => dataName?.id == pool?.dataProvider
    )
    if (dataName?.name != null) {
      setDataSourceName(dataName?.name)
      setCheckIcon(true)
    } else {
      setDataSourceName('Unknown')
      setCheckIcon(false)
    }
  }, [dataSource.dataProviders, pool.dataProvider])

  return (
    <PageDiv>
      <HeaderDiv>
        <HeaderLabel>Details</HeaderLabel>
      </HeaderDiv>
      <FlexDiv>
        <Tooltip title={getDateTime(pool.expiryTime).slice(12)} arrow>
          <FlexBox>
            <FlexBoxHeader>Expires at</FlexBoxHeader>
            <FlexBoxData>
              {getDateTime(pool.expiryTime).slice(0, 10)}
              {'  '}
            </FlexBoxData>
          </FlexBox>
        </Tooltip>
        <FlexBox>
          <FlexBoxHeader>Direction</FlexBoxHeader>
          <FlexBoxData>{isLong ? 'Up' : 'Down'}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <Tooltip
            placement="top-end"
            title="Value of the reference asset at or below which the long token pays out 0 and the short token 1 (max payout)."
          >
            <FlexBoxHeader>Floor</FlexBoxHeader>
          </Tooltip>
          <FlexBoxData>{formatEther(pool.floor)}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <Tooltip
            placement="top-end"
            title="Value of the reference asset at which the long token pays out Gradient and the short token 1 - Gradient (see advanced settings)."
          >
            <FlexBoxHeader>Inflection</FlexBoxHeader>
          </Tooltip>
          <FlexBoxData>{formatEther(pool.inflection)}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <Tooltip
            placement="top-end"
            title="Value of the reference asset at or above which the long token pays out 1 (max payout) and the short token 0."
          >
            <FlexBoxHeader>Cap</FlexBoxHeader>
          </Tooltip>
          <FlexBoxData>{formatEther(pool.cap)}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <Tooltip
            placement="top-end"
            title="Payout of long token at inflection. Short token payout at inflection is 1-Gradient."
          >
            <FlexBoxHeader>Gradient</FlexBoxHeader>
          </Tooltip>
          <FlexBoxData>
            {Number(
              formatUnits(
                BigNumber.from(pool.collateralBalanceLongInitial)
                  .mul(parseUnits('1', pool.collateralToken.decimals))
                  .div(
                    BigNumber.from(pool.collateralBalanceLongInitial).add(
                      BigNumber.from(pool.collateralBalanceShortInitial)
                    )
                  ),

                pool.collateralToken.decimals
              )
            ).toFixed(2)}
          </FlexBoxData>
        </FlexBox>
      </FlexDiv>
      <FlexSecondLineDiv>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Data Provider</FlexBoxHeader>

          <FlexBoxSecondLineData>
            <Tooltip title={pool.dataProvider} arrow>
              <FlexCheckIcon>
                {dataSourceName}

                {checkIcon ? (
                  <Tooltip title="Trusted data provider from the DIVA whitelist">
                    <CheckCircleSharpIcon
                      sx={{
                        mt: 0.3,
                        paddingLeft: 1,
                      }}
                      color="success"
                      fontSize="inherit"
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title="Untrusted data provider">
                    <WarningAmberSharpIcon
                      sx={{
                        mt: 0.3,
                        paddingLeft: 1,
                      }}
                      color="warning"
                      fontSize="inherit"
                    />
                  </Tooltip>
                )}
              </FlexCheckIcon>
            </Tooltip>
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Collateral</FlexBoxHeader>
          <FlexBoxSecondLineData>
            <Tooltip title={pool.collateralToken.id} arrow placement="bottom">
              <FlexCheckIcon>
                {Number(
                  formatUnits(
                    pool.collateralBalance,
                    pool.collateralToken.decimals
                  )
                ).toFixed(2) +
                  ' ' +
                  pool.collateralToken.symbol}
              </FlexCheckIcon>
            </Tooltip>
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>
      </FlexSecondLineDiv>
    </PageDiv>
  )
}
