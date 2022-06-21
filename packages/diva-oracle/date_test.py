from datetime import datetime, timedelta
tim = datetime.now()
print(tim + timedelta(1))
print(int(tim.timestamp()))