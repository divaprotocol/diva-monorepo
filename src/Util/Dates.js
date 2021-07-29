export function getDateTime(dateData) {
  var date = new Date(dateData * 1e3).toISOString().slice(0, 10)
  var time = new Date(dateData * 1e3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return date + " " + time;
}