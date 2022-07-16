import smtplib, ssl
import config.config as config
import pandas as pd
from datetime import datetime  as dt

ON = True

def message_craft(df):
    message = "Subject: Diva - New Pools"
    message += "\n"
    message += "\n"
    message += "New Pool created notification \n"
    for key,i in df.iterrows():
         print(i)
         message += "New Pool {}, created at {}, set to expire at {}".format(i['id'], dt.fromtimestamp(int(i['createdAt'])), dt.fromtimestamp(int(i['expiryTime'])) )
         message += "\n"
    return message

def sendEmail(ON, df):
    smtp_server = "smtp.gmail.com"
    port = 587  # For starttls
    sender_email = config.sender_email
    password = config.pass_code
    receiver_email = "diva.protocol.bot@gmail.com"
    #receiver_email = "wladimir.weinbender@googlemail.com"
    # Wlad's email googlemail
    # wladimir.weinbender@googlemail.com
    message = message_craft(df)
    message1 = """
    Subject: Diva message
    This message is sent from Python.
     """ 
    print(message)
    if ON == True:
    # Create a secure SSL contexßt
        context = ssl.create_default_context()

        # Try to log in to server and send email
        try:
            server = smtplib.SMTP(smtp_server,port)
            # Below commands are for secure sending of emails
            server.ehlo() # Can be omitted
            server.starttls(context=context) # Secure the connection
            server.ehlo() # Can be omitted
            server.login(sender_email, password)
            # TODO: Send email here
            server.sendmail(sender_email, receiver_email, message)
            print("Email sent")
        except Exception as e:
            # Print any error messages to stdout
            print(e)
        finally:
            server.quit() 
