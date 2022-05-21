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

## Helpful links

- Python poetry docs: https://python-poetry.org/docs/
