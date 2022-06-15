FROM python:3.8

RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3 -


COPY main.py
COPY helpers/ .
COPY .env
COPY poetry.lock pyproject.toml