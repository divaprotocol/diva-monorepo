import { formatEther } from 'ethers/lib/utils'

// Function to provide users more detailed settlement status information than is provided
// in the smart contract. Function returns both, the status of the final reference value as well as the
// (expected) final reference value itself.
export function getAppStatus(
  expiryTime: string,
  statusTimestamp: string,
  statusFinalReferenceValue: string,
  finalReferenceValue: string,
  inflection: string
): { finalValue: number | string; status: string } {
  const dtExpiryTime = new Date(parseInt(expiryTime) * 1000)
  const dtStatusTimestamp = new Date(parseInt(statusTimestamp) * 1000)
  const now = new Date().getTime()
  const submissionPeriodEnd = new Date(parseInt(expiryTime) * 1000).setMinutes(
    dtExpiryTime.getMinutes() + 24 * 60 + 5
  )
  const fallbackPeriodEnd = new Date(parseInt(expiryTime) * 1000).setMinutes(
    dtExpiryTime.getMinutes() + 6 * 24 * 60 + 5
  ) // 5 min delay built in to have a high confidence that block.timestamp during call will be > fallback period end
  const challengePeriodEnd = new Date(
    parseInt(statusTimestamp) * 1000
  ).setMinutes(dtStatusTimestamp.getMinutes() + 1 * 24 * 60 + 5) // statusTimestamp is equal to time of submission when it's used below in the code. 5 min delay built in to have a high confidence that block.timestamp during call will be > challenge period end
  const reviewPeriodEnd = new Date(parseInt(statusTimestamp) * 1000).setMinutes(
    dtStatusTimestamp.getMinutes() + 2 * 24 * 60 + 5
  ) // statusTimestamp is equal to time of first challenge following a submission when it's used down below in the code. 5 min delay built in to have a high confidence that block.timestamp during call will be > review period end

  let finalValue = '-'
  let status = statusFinalReferenceValue

  if (now < dtExpiryTime.getTime()) {
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

export const statusDescription = {
  Open: `Pool has not expired yet.`,
  Expired: `Pool expired and the final value input from the data provider is pending.`,
  Submitted: `A final value has been submitted by the data provider.`,
  Challenged: `The final value submitted by the data provider has been challenged by position token holders.`,
  Fallback: `The data provider failed to submit a final value within the 24h submission period. The fallback data provider has 5 days to step in and submit a value. This is only to be expected for whitelisted data providers. For non-whitelisted data providers, the fallback data provider may not submit a value in which case it will default to inflection.`,
  ['Confirmed*']: `The final value will be confirmed inside the smart contract at first user redemption.`,
  Confirmed: `The final value has been confirmed and position token holders can start redeeming their LONG & SHORT position tokens.`,
}
