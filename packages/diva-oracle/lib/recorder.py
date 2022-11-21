from termcolor import colored
from tabulate import tabulate

# This file will write sent transactions to csv file

def update_records(record):
    file = open("oracle_records.csv", "a")
    file.write(record)
    file.write(',')
    file.write('\n')

    file.close()


def update_pending_records(record):
    file = open("pending_txns.csv", "a")
    file.write(record)
    file.write(',')
    file.write('\n')

    file.close()


def printbAll(text):
    print(colored(text, attrs=["bold"]))
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

def printb(textb, text):
    print(colored(textb, attrs=["bold"]) + str(text))
    with open('log.txt', 'a') as f:
        f.write(textb + text + "\n")

def printc(text, col):
    print(colored(text, col))
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

def printn(text):
    print(text)
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

def printt(val):
    print(tabulate(val, headers=['RefValue', 'CollValue', 'Timestmp', 'isDisputed']))
    with open('log.txt', 'a') as f:
        for x in val:
            f.write("(RefValue, CollValue, Timestmp, isDisputed) =  (%s, %s, %s, %s) \n" % (x[0], x[1], x[2], x[3]))

