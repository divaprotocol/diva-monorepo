// This hook is currently not used but kept for future potential use
import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useConnectionContext } from './useConnectionContext'
import DIVA_ABI from '../abi/DIVAABI.json'
import { config } from '../constants'

export const useGovernanceParameters = () => {
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId

  const [submissionPeriod, setSubmissionPeriod] = useState(0)
  const [challengePeriod, setChallengePeriod] = useState(0)
  const [reviewPeriod, setReviewPeriod] = useState(0)
  const [fallbackPeriod, setFallbackPeriod] = useState(0)

  const diva = useMemo(() => {
    const contract = chainId
      ? new ethers.Contract(
          config[chainId].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null
    return contract
  }, [chainId, provider])

  useEffect(() => {
    if (diva) {
      diva.getGovernanceParameters().then((governanceParameters) => {
        setSubmissionPeriod(
          governanceParameters.currentSettlementPeriods.submissionPeriod // TODO Pull that information from pool query instead doing this as these might not apply to a specific pool
        )
        setChallengePeriod(
          governanceParameters.currentSettlementPeriods.challengePeriod
        )
        setReviewPeriod(
          governanceParameters.currentSettlementPeriods.reviewPeriod
        )
        setFallbackPeriod(
          governanceParameters.currentSettlementPeriods.fallbackSubmissionPeriod
        )
      })
    }
  }, [diva])

  return {
    submissionPeriod,
    challengePeriod,
    reviewPeriod,
    fallbackPeriod,
  }
}
