FROM python:3.8

# copy all contents into the Docker file
COPY . .

RUN pip3 install poetry

RUN poetry install

# u is unbuffered output to see python returns
CMD ["poetry", "run", "python3", "-u", "price_main.py"]
