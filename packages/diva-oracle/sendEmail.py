import smtplib, ssl
import config


def sendEmail(message, receiver_email="divapoolmail@gmail.com", port=465):
    smtp_server = "smtp.gmail.com"
    sender_email = config.email
    password = config.emailpassword

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, message)