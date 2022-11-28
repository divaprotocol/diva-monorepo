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


def printbAll(text, color=None, underline=None):
    if color:
        if underline:
            print(colored(text, color, attrs=["bold", "underline"]))
        else:
            print(colored(text, color, attrs=["bold"]))
    else:
        print(colored(text, attrs=["bold", "underline"]))
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

def printb(textb, text, color=None):
    if color:
        print(colored(textb, color, attrs=["bold"]) + str(text))
    else:
        print(colored(textb, attrs=["bold"]) + str(text))
    with open('log.txt', 'a') as f:
        f.write(textb + text + "\n")

def printc(text1, text2, col):
    print(text1 + colored(text2, col))
    with open('log.txt', 'a') as f:
        f.write(text1 + text2 + "\n")

def printn(text, color=None):
    if color:
        print(colored(text, color))
    else:
        print(text)
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

def printt(val):
    print(tabulate(val, headers=['RefValue', 'CollValue', 'Timestmp', 'isDisputed']))
    with open('log.txt', 'a') as f:
        for x in val:
            f.write("(RefValue, CollValue, Timestmp, isDisputed) =  (%s, %s, %s, %s) \n" % (x[0], x[1], x[2], x[3]))


def printr(text, color=None):
    if color:
        print(colored(text, color, attrs=["bold", "reverse"]))
    else:
        print(text)
    with open('log.txt', 'a') as f:
        f.write(text + "\n")

