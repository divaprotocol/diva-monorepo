# Running with Docker
Upon a working script and configuration docker can be used to run  the oracle
This will build the image, a rebuild is needed on every new file change

```
docker-compose up --build
```
This will run and build the image. Once the image is built. simply use below to run. This can easily spin up spin down along with development

```
docker-compose up
```

## Poetry installation for local development and troubleshooting
1. Install poetry:

- osx / linux / bashonwindows install instructions:

```
curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -
```

- windows powershell install instructions:

```
(Invoke-WebRequest -Uri https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py -UseBasicParsing).Content | python -
```

2. Install dependencies:

```
poetry install
```

3. Run code in your_script.py:

```
poetry run python your_script.py
```

4. Adding packages:

```
poetry add pandas
```

3. Trouble shooting:

- If `poetry` is not recognized a valid command in your terminal (e.g., when running `poetry --version`), try to add the following path variable in windows `%USERPROFILE%\.poetry\bin`
- If it's still not working, try to run visual studio / the console in administrator mode
- For windows user, prefer to run it in Powershell outside of a windows folder (i.e. not in `/mnt/wsl`)

## Helpful links

- Python poetry docs: https://python-poetry.org/docs/
