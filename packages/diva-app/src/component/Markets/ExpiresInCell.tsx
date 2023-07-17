import { Tooltip } from '@mui/material'
import { getExpiryMinutesFromNow, userTimeZone } from '../../Util/Dates'

export const ExpiresInCell = (props: any) => {
  //replaces all occurances of "-" with "/", firefox doesn't support "-" in a date string
  const expTimestamp = new Date(props.row.Expiry.replace(/-/g, '/')).getTime()
  const minUntilExp = getExpiryMinutesFromNow(expTimestamp / 1000)
  if (minUntilExp > 0) {
    if ((minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) > 0) {
      // More than a day
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) +
              'd ' +
              ((minUntilExp % (60 * 24)) - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if (
      (minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) === 0 &&
      (minUntilExp - (minUntilExp % 60)) / 60 > 0
    ) {
      // Less than a day but more than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if ((minUntilExp - (minUntilExp % 60)) / 60 === 0) {
      // Less than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp % 60) + 'm '}
          </span>
        </Tooltip>
      )
    }
  } else if (Object.is(0, minUntilExp)) {
    // Using Object.is() to differentiate between +0 and -0
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    )
  } else {
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'-'}</span>
      </Tooltip>
    )
  }
}
