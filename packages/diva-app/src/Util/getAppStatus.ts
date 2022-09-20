import { formatEther } from 'ethers/lib/utils'

// Function to provide users more detailed settlement status information than is provided
// in the smart contract. Function returns both, the status of the final reference value as well as the
// (expected) final reference value itself.
export function getAppStatus(
  expiryTime: string, // in milliseconds
  statusTimestamp: string,
  statusFinalReferenceValue: string,
  finalReferenceValue: string,
  inflection: string,
  submissionPeriod: number, // in seconds
  challengePeriod: number, // in seconds
  reviewPeriod: number, // in seconds
  fallbackPeriod: number // in seconds
): { finalValue: number | string; status: string } {
  // Convert strings to Date objects
  const dtExpiryTime = new Date(parseInt(expiryTime) * 1000)
  const dtStatusTimestamp = new Date(parseInt(statusTimestamp) * 1000)

  // Get current time
  const now = new Date().getTime()

  // Get end dates for settlement periods
  const submissionPeriodEnd = dtExpiryTime.getTime() + submissionPeriod * 1000
  // Ok to use dtExpiryTime only and not max(dtExpiryTime, dtStatusTimestamp) as submissionPeriodEnd is only used when statusFinalReferenceValue === 'Open' below in the code.

  const fallbackPeriodEnd =
    dtExpiryTime.getTime() + (submissionPeriod + fallbackPeriod) * 1000

  const challengePeriodEnd =
    dtStatusTimestamp.getTime() + challengePeriod * 1000 // statusTimestamp is equal to time of submission when it's used below in the code.
  const reviewPeriodEnd = dtStatusTimestamp.getTime() + reviewPeriod * 1000 // statusTimestamp is equal to time of first challenge following a submission when it's used down below in the code.

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
