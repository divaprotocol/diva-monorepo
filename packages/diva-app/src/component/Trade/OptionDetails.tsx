import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getDateTime, userTimeZone } from '../../Util/Dates'
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
  width: max-content;
  padding-left: 15px;
  color: gray;
`

const FlexBoxData = styled.div`
  padding: 15px;
  width: 100%;
  font-size: 1rem;
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
  width: 34%;
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
  flex: 1;
`

const FlexBoxSecondLineData = styled.div`
  padding: 15px;
  width: max-content;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`
const FlexCheckIcon = styled.div`
  display: flex;
  flex-direction: row;
`
const FlexDataDiv = styled.div`
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
  const [binary, setBinary] = useState(false)
  const [linear, setLinear] = useState(false)
  useEffect(() => {
    if (pool.cap === pool.floor) {
      setBinary(true)
      setLinear(false)
    } else if (
      BigNumber.from(pool.inflection).eq(
        BigNumber.from(pool.floor)
          .add(BigNumber.from(pool.cap))
          .div(BigNumber.from('2'))
      )
    ) {
      setBinary(false)
      setLinear(true)
    }
  }, [pool])
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
  console.log('pool state', binary, linear)
  return (
    <PageDiv>
      <HeaderDiv>
        <HeaderLabel>Details</HeaderLabel>
      </HeaderDiv>
      <FlexDiv>
        <FlexBox>
          <FlexBoxHeader>Expires at</FlexBoxHeader>
          <FlexBoxData>
            <Tooltip
              title={
                getDateTime(pool.expiryTime).slice(11, 19) +
                ' ' +
                userTimeZone()
              }
              arrow
            >
              <FlexDataDiv>
                {getDateTime(pool.expiryTime).slice(0, 10)}
                {'  '}
              </FlexDataDiv>
            </Tooltip>
          </FlexBoxData>
        </FlexBox>

        <FlexBox>
          <FlexBoxHeader>Direction</FlexBoxHeader>
          <FlexBoxData>{isLong ? 'Up' : 'Down'}</FlexBoxData>
        </FlexBox>
        {binary ? (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Binary</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or above which the LONG token pays ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Inflection</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' below which the SHORT token pays ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Inflection</FlexBoxHeader>
                </Tooltip>
              )}
              <FlexBoxData>{formatEther(pool.inflection)}</FlexBoxData>
            </FlexBox>
          </>
        ) : linear ? (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Linear</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or below which the LONG token pays out ' +
                    pool.collateralToken.symbol +
                    ' 0.'
                  }
                >
                  <FlexBoxHeader>Floor</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or below which the SHORT token pays out ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Floor</FlexBoxHeader>
                </Tooltip>
              )}
              <FlexBoxData>{formatEther(pool.floor)}</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or above which the LONG token pays out ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Cap</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or above which the SHORT token pays out ' +
                    pool.collateralToken.symbol +
                    ' 0.'
                  }
                >
                  <FlexBoxHeader>Cap</FlexBoxHeader>
                </Tooltip>
              )}
              <FlexBoxData>{formatEther(pool.cap)}</FlexBoxData>
            </FlexBox>
          </>
        ) : (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Custom</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or below which the LONG token pays out ' +
                    pool.collateralToken.symbol +
                    ' 0.'
                  }
                >
                  <FlexBoxHeader>Floor</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or below which the SHORT token pays out ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Floor</FlexBoxHeader>
                </Tooltip>
              )}

              <FlexBoxData>{formatEther(pool.floor)}</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or above which the LONG token pays out ' +
                    pool.collateralToken.symbol +
                    ' 1.0.'
                  }
                >
                  <FlexBoxHeader>Cap</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Value of ' +
                    pool.referenceAsset +
                    ' at or above which the SHORT token pays out ' +
                    pool.collateralToken.symbol +
                    ' 0.'
                  }
                >
                  <FlexBoxHeader>Cap</FlexBoxHeader>
                </Tooltip>
              )}
              <FlexBoxData>{formatEther(pool.cap)}</FlexBoxData>
            </FlexBox>
            <FlexBox>
              <Tooltip
                placement="top-end"
                title={
                  'Value of ' +
                  pool.referenceAsset +
                  ' at which the LONG token payout is equal to Gradient.'
                }
              >
                <FlexBoxHeader>Inflection</FlexBoxHeader>
              </Tooltip>
              <FlexBoxData>{formatEther(pool.inflection)}</FlexBoxData>
            </FlexBox>
            <FlexBox>
              {isLong ? (
                <Tooltip
                  placement="top-end"
                  title={
                    'Payout per LONG token if ' +
                    pool.referenceAsset +
                    ' ends up at inflection.'
                  }
                >
                  <FlexBoxHeader>Gradient</FlexBoxHeader>
                </Tooltip>
              ) : (
                <Tooltip
                  placement="top-end"
                  title={
                    'Payout per SHORT token if ' +
                    pool.referenceAsset +
                    ' ends up at inflection.'
                  }
                >
                  <FlexBoxHeader>Gradient</FlexBoxHeader>
                </Tooltip>
              )}
              {isLong ? (
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
              ) : (
                <FlexBoxData>
                  {Number(
                    formatUnits(
                      parseUnits('1', pool.collateralToken.decimals).sub(
                        BigNumber.from(pool.collateralBalanceLongInitial)
                          .mul(parseUnits('1', pool.collateralToken.decimals))
                          .div(
                            BigNumber.from(
                              pool.collateralBalanceLongInitial
                            ).add(
                              BigNumber.from(pool.collateralBalanceShortInitial)
                            )
                          )
                      ),

                      pool.collateralToken.decimals
                    )
                  ).toFixed(2)}
                </FlexBoxData>
              )}
            </FlexBox>
          </>
        )}
      </FlexDiv>
      <FlexSecondLineDiv>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Data Provider</FlexBoxHeader>

          <FlexBoxSecondLineData>
            <FlexDataDiv>
              <Tooltip title={pool.dataProvider} arrow>
                <FlexCheckIcon>{dataSourceName}</FlexCheckIcon>
              </Tooltip>
              {checkIcon ? (
                <Tooltip
                  title="Trusted data provider from the DIVA whitelist."
                  arrow
                >
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
                <Tooltip
                  title="Data provider is NOT part of DIVA's whitelist."
                  arrow
                >
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
            </FlexDataDiv>
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>
        <FlexBoxSecondLine>
          <FlexBoxHeader>Collateral</FlexBoxHeader>
          <FlexBoxSecondLineData>
            <Tooltip title={pool.collateralToken.id} arrow placement="bottom">
              <FlexDataDiv>
                {Number(
                  formatUnits(
                    pool.collateralBalance,
                    pool.collateralToken.decimals
                  )
                ).toFixed(2) +
                  ' ' +
                  pool.collateralToken.symbol}
              </FlexDataDiv>
            </Tooltip>
          </FlexBoxSecondLineData>
        </FlexBoxSecondLine>
      </FlexSecondLineDiv>
    </PageDiv>
  )
}
