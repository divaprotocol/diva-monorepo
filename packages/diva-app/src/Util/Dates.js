function formatAMPM(date) {
  var hours = date.getHours()
  var minutes = date.getMinutes()
  var ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes // converts "4:4 PM" into "4:04 PM"
  var strTime = hours + ':' + minutes + ' ' + ampm
  return strTime
}

export function getDateTime(dateData) {
  var date = new Date(dateData * 1e3).toISOString().slice(0, 10)
  var time = formatAMPM(new Date(dateData * 1e3))
  return date + ' ' + time
}

export function getExpiryMinutesFromNow(Timestamp) {
  const expiryTime = new Date(Timestamp * 1000)
  const date = new Date()
  const mins = parseInt((expiryTime.getTime() - date.getTime()) / 1000 / 60)
  return mins
}

export const isExpired = (Timestamp) => {
  return getExpiryMinutesFromNow(Timestamp) < 0 ? true : false
}

export const userTimeZone = () => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  console.log('timeZone: ' + timeZone)
  return timeZone
}
