# Purpose
The purpose of this repo is to run a DIVA price Oracle for certian trading pairs. This Oracle can run in the background constantly querying for price inputs to pools. The Oracle will only submit for pools where the wallet defined is the data provider. 

## Usage
There are a few levers to manage in terms of configuring the Oracle.
1. main.py defines, pool pairs and cycle wait time
2. .env file is where the key pair is defined for data provider, DIVA contract locations for various chains. See .env.example for options. 
3. ChainSet.py is where the Chain ID is set to cascade configs across the Oracle. 

### Installion for usage
1. Install poetry: 

* osx / linux / bashonwindows install instructions:
```
curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -
```
* windows powershell install instructions:
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
* If `poetry` is not recognized a valid command in your terminal (e.g., when running `poetry --version`), try to add the following path variable in windows `%USERPROFILE%\.poetry\bin`
* If it's still not working, try to run visual studio / the console in administrator mode

#### Helpful links
* Python poetry docs: https://python-poetry.org/docs/


