import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates'
import { Tooltip } from '@mui/material'
import { Pool } from '../../lib/queries'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import { useWhitelist } from '../../hooks/useWhitelist'
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp'
import WarningAmberSharpIcon from '@mui/icons-material/WarningAmberSharp'
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
`

const FlexBoxData = styled.div`
  padding: 15px;
  font-size: 0.9rem;
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
  width: 65%;
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

const FlexToolTipBoxData = styled.div`
  margin-left: 15px;
  padding-top: 15px;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  text-align: left;
`

const FlexBoxSecondLineData = styled.div`
  padding: 15px;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
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
  const collateralBalanceLongInitial = Number(
    formatUnits(
      pool.collateralBalanceLongInitial,
      pool.collateralToken.decimals
    )
  )
  const collateralBalanceShortInitial = Number(
    formatUnits(
      pool.collateralBalanceShortInitial,
      pool.collateralToken.decimals
    )
  )
  const longShortCollateralSum =
    collateralBalanceLongInitial + collateralBalanceShortInitial
  const longCollateralRatio =
    (collateralBalanceLongInitial / longShortCollateralSum) * 100
  const shortCollateralRatio =
    (collateralBalanceShortInitial / longShortCollateralSum) * 100
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
        <FlexBox>
          <FlexBoxHeader>Expires at</FlexBoxHeader>
          <FlexBoxData>{getDateTime(pool.expiryTime).slice(0, 10)}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Direction</FlexBoxHeader>
          <FlexBoxData>{isLong ? 'Up' : 'Down'}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Floor</FlexBoxHeader>
          <FlexBoxData>{parseInt(pool.floor) / 1e18}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Inflection</FlexBoxHeader>
          <FlexBoxData>{parseInt(pool.inflection) / 1e18}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Cap</FlexBoxHeader>
          <FlexBoxData>{Number(formatEther(pool.cap))}</FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Collateral</FlexBoxHeader>
          <Tooltip title={pool.collateralToken.id} arrow>
            <FlexBoxData>
              {Number(
                formatUnits(
                  pool.collateralBalance,
                  pool.collateralToken.decimals
                )
              ).toFixed(2) +
                ' ' +
                pool.collateralToken.symbol}
            </FlexBoxData>
          </Tooltip>
        </FlexBox>
      </FlexDiv>
      <FlexSecondLineDiv>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Data provider</FlexBoxHeader>
          <Tooltip title={pool.dataProvider} arrow>
            <FlexToolTipBoxData>
              {pool.dataProvider.length > 0
                ? String(pool.dataProvider).substring(0, 6) +
                  '...' +
                  String(pool.dataProvider).substring(38)
                : 'n/a'}
            </FlexToolTipBoxData>
          </Tooltip>
        </FlexBoxSecondLine>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Data source</FlexBoxHeader>
          <FlexBoxSecondLineData>
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
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>

        <FlexBoxSecondLine>
          <FlexBoxHeader>Short/Long ratio</FlexBoxHeader>
          <FlexBoxSecondLineData>
            {shortCollateralRatio.toFixed()} / {longCollateralRatio.toFixed()}
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>
      </FlexSecondLineDiv>
    </PageDiv>
  )
}
