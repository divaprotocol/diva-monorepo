import smtplib, ssl
# https://realpython.com/python-send-email/

def sendEmail(df):
    smtp_server = "localhost"
    port = 1025  # For starttls
    sender_email = "my@gmail.com"
    password = "password"
    receiver_email = "your@gmail.com"
    message = """\
    Subject: Hi there

    This message is sent from Python.
     """ 
    for index,row in df.iterrows():
        print(row)
        message += str(row)
    

    # Create a secure SSL context
    context = ssl.create_default_context()

    # Try to log in to server and send email
    try:
        server = smtplib.SMTP(smtp_server,port)
        # Below commands are for secure sending of emails
        #server.ehlo() # Can be omitted
        #server.starttls(context=context) # Secure the connection
        #server.ehlo() # Can be omitted
        #server.login(sender_email, password)
        # TODO: Send email here
        server.sendmail(sender_email, receiver_email, message)
    except Exception as e:
        # Print any error messages to stdout
        print(e)
    finally:
        server.quit() 