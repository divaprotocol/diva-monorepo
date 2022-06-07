import { formatEther } from 'ethers/lib/utils'

export function getAppStatus(
  expiryTime: string,
  statusTimestamp: string,
  statusFinalReferenceValue: any,
  finalReferenceValue: any,
  inflection: any
) {
  const expiryTime2 = new Date(parseInt(expiryTime) * 1000)
  const statusTimestamp2 = new Date(parseInt(statusTimestamp) * 1000)
  const now = new Date().getTime()
  const submissionPeriodEnd = new Date(parseInt(expiryTime) * 1000).setMinutes(
    expiryTime2.getMinutes() + 24 * 60 + 5
  )
  const fallbackPeriodEnd = new Date(parseInt(expiryTime) * 1000).setMinutes(
    expiryTime2.getMinutes() + 6 * 24 * 60 + 5
  ) // 5 min delay built in to have a high confidence that block.timestamp during call will be > fallback period end
  const challengePeriodEnd = new Date(
    parseInt(statusTimestamp) * 1000
  ).setMinutes(statusTimestamp2.getMinutes() + 1 * 24 * 60 + 5) // statusTimestamp is equal to time of submission when it's used below in the code. 5 min delay built in to have a high confidence that block.timestamp during call will be > challenge period end
  const reviewPeriodEnd = new Date(parseInt(statusTimestamp) * 1000).setMinutes(
    statusTimestamp2.getMinutes() + 2 * 24 * 60 + 5
  ) // statusTimestamp is equal to time of first challenge following a submission when it's used down below in the code. 5 min delay built in to have a high confidence that block.timestamp during call will be > review period end

  let finalValue = '-'
  let status = statusFinalReferenceValue

  if (now < expiryTime2.getTime()) {
    finalValue = '-'
    // statusFinalReferenceValue is 'Open' in that case
  } else {
    if (statusFinalReferenceValue === 'Open') {
      if (now <= submissionPeriodEnd) {
        status = 'Expired'
      } else if (now > submissionPeriodEnd && now <= fallbackPeriodEnd) {
        status = 'Fallback'
      } else if (now > fallbackPeriodEnd) {
        finalValue = parseFloat(formatEther(inflection)).toFixed(4)
        status = 'Confirmed*'
      }
    } else if (
      (statusFinalReferenceValue === 'Challenged' && now > reviewPeriodEnd) ||
      (statusFinalReferenceValue === 'Submitted' && now > challengePeriodEnd)
    ) {
      finalValue = parseFloat(formatEther(finalReferenceValue)).toFixed(4)
      status = 'Confirmed*'
    } else {
      // Submitted or (Challenged && within the challenge period)
      finalValue = parseFloat(formatEther(finalReferenceValue)).toFixed(4)
      status = statusFinalReferenceValue
    }
  }

  return { finalValue, status }
}
