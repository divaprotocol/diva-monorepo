
# This file will write sent transactions to csv file

def update_records(record):
    file = open("oracle_records.csv", "a")
    file.write(record)
    file.write(',')
    file.write('\n')

    file.close()