import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useConnectionContext } from './useConnectionContext'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
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
        setSubmissionPeriod(governanceParameters.submissionPeriod.toNumber())
        setChallengePeriod(governanceParameters.challengePeriod.toNumber())
        setReviewPeriod(governanceParameters.reviewPeriod.toNumber())
        setFallbackPeriod(governanceParameters.fallbackPeriod.toNumber())
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
