import smtplib
import ssl
import config.config as config
import pandas as pd
from datetime import datetime as dt

ON = True


def hour_conversion(hours):
    return hours*60*60


def message_craft_new_pool(df):
    message = "Subject: Diva - New Pools"
    message += "\n"
    message += "\n"
    message += "New Pool created notification \n"
    for key, i in df.iterrows():
        print(i)
        message += "New Pool {}, created at {}, set to expire at {}".format(
            i['id'], dt.fromtimestamp(int(i['createdAt'])), dt.fromtimestamp(int(i['expiryTime'])))
        message += "\n"
    return message


def message_craft_pool_expiry(df, notification_ceiling, notification_floor=0):
    message = "Subject: Diva - Pool Expiry"
    message += "\n"
    message += "\n"
    message += "Pool Expirty notification \n"
    for key, i in df.iterrows():
        if (dt.now().timestamp() + hour_conversion(notification_floor)) < int(i['expiryTime']) < (dt.now().timestamp() + hour_conversion(notification_ceiling)):
            print("made it")
            print(i)
            print("now")
            print(dt.now())
            message += "New Pool {}, Expires in {} hours, set to expire at {}".format(
                i['id'], int((int(i['expiryTime']) - dt.now().timestamp())/(60*60)), dt.fromtimestamp(int(i['expiryTime'])))
            message += "\n"
    sendEmail(False, message)
    return


def sendEmail(ON, message):
    smtp_server = "smtp.gmail.com"
    port = 587  # For starttls
    sender_email = config.sender_email
    password = config.pass_code
    receiver_email = "diva.protocol.bot@gmail.com"
    # receiver_email = "wladimir.weinbender@googlemail.com"
    # Wlad's email googlemail
    # wladimir.weinbender@googlemail.com
    message = message
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
            server = smtplib.SMTP(smtp_server, port)
            # Below commands are for secure sending of emails
            server.ehlo()  # Can be omitted
            server.starttls(context=context)  # Secure the connection
            server.ehlo()  # Can be omitted
            server.login(sender_email, password)
            # TODO: Send email here
            server.sendmail(sender_email, receiver_email, message)
            print("Email sent")
        except Exception as e:
            # Print any error messages to stdout
            print(e)
        finally:
            server.quit()
    else:
        print("email notifications set to False; message not sent")
        # print(message)
