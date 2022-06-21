FROM python:3.8

# copy all contents into the Docker file
COPY . .

RUN pip3 install poetry

RUN poetry install

CMD ["poetry", "run", "python3", "main.py"]