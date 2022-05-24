export function getDateTime(dateData) {
  var date = new Date(dateData * 1e3).toISOString().slice(0, 10)
  var time = new Date(dateData * 1e3).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
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
  return timeZone
}
