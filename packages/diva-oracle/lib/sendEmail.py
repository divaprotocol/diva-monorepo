import smtplib, ssl
import config.config as config



def sendEmail():
    smtp_server = "smtp.gmail.com"
    port = 587  # For starttls
    sender_email = config.sender_email
    password = config.pass_code
    receiver_email = "diva.protocol.bot@gmail.com"
    message = """
    Subject: Diva message
    This message is sent from Python.
     """ 
    

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
