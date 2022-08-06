import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getDateTime, userTimeZone } from '../../Util/Dates'
import { Tooltip } from '@mui/material'
import { Pool } from '../../lib/queries'
import { formatUnits } from 'ethers/lib/utils'
import { useWhitelist } from '../../hooks/useWhitelist'
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp'
import WarningAmberSharpIcon from '@mui/icons-material/WarningAmberSharp'
import { BigNumber } from 'ethers'
import { useAppSelector } from '../../Redux/hooks'
const PageDiv = styled.div`
  width: 100%;
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
  const intrinsicValue = useAppSelector((state) => state.stats.intrinsicValue)
  const maxYield = useAppSelector((state) => state.stats.maxYield)
  const [fontColor, setFontColor] = useState('#ffff')
  const [isIntrinsicValue, setIsIntrinsicValue] = useState(false)
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

  useEffect(() => {
    if (maxYield != 'n/a') {
      setFontColor('#3393E0')
    }
  }, [maxYield])
  useEffect(() => {
    if (intrinsicValue != 'n/a') {
      setIsIntrinsicValue(true)
    }
  }, [intrinsicValue])

  return (
    <PageDiv>
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
        {binary ? (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Binary</FlexBoxData>
            </FlexBox>
          </>
        ) : linear ? (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Linear</FlexBoxData>
            </FlexBox>
          </>
        ) : (
          <>
            <FlexBox>
              <FlexBoxHeader>Payoff Type</FlexBoxHeader>
              <FlexBoxData>Custom</FlexBoxData>
            </FlexBox>
          </>
        )}
        <FlexBox>
          <FlexBoxHeader>Data Provider</FlexBoxHeader>
          <FlexBoxData>
            <FlexCheckIcon>
              <Tooltip title={pool.dataProvider} arrow>
                <FlexDataDiv>{dataSourceName}</FlexDataDiv>
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
            </FlexCheckIcon>
          </FlexBoxData>
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Collateral</FlexBoxHeader>
          <Tooltip title={pool.collateralToken.id} arrow placement="bottom">
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
        <FlexBox>
          <FlexBoxHeader>Intrinsic Value</FlexBoxHeader>
          {isIntrinsicValue ? (
            <FlexBoxData>
              {parseFloat(intrinsicValue).toFixed(2) +
                ' ' +
                pool.collateralToken.symbol}
            </FlexBoxData>
          ) : (
            <FlexBoxData>n/a</FlexBoxData>
          )}
        </FlexBox>
        <FlexBox>
          <FlexBoxHeader>Max yield</FlexBoxHeader>
          <FlexBoxData style={{ color: fontColor }}>{maxYield}</FlexBoxData>
        </FlexBox>
      </FlexDiv>
    </PageDiv>
  )
}
