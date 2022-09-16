# Oracle Layout
The Oracle directory contains three differnet types of oracles which can be run on need:
1. Email Oracle (`email_main.py`): Email notification service for human reporters
2. Price Oracle (`price_main.py`): Centralized oracle bot sourcing prices from Kraken
3. Tellor Oracle (`tellor_main.py`): Tellor client using prices from Kraken

## Adding config file
Add a `config.py` file to the `config` folder following the `config.example.py` example.
The oracles will not work without a properly configured config file

# Running _with_ Docker

## Setting an Oracle to run
Picking an Oracle to run is orchestrated within the 
```
DockerFile
```
On the `CMD` line, set the last argument to the desired Oracle.
For naming sake, a rename of the oracle can be done under `container_name` in
```
docker-compose.yml
```

Note the updates have the docker run in detached mode! This will run unless prompted to kill
```
docker-compose down
```

## Starting Docker
Upon a working script and configuration, docker can be used to run the oracle. 
The following command will run and build the image. Note that a rebuild is needed on every new file change.

```
docker-compose up --build
```

Once the image is built, run below command to spin up or down along with development.

```
docker-compose up
```

## Trouble shooting
* If you face an error saying "The command 'docker-compose' could not be found in the WSL 2 distro. We recommend to activate the WSL integration in Docker Desktop settings." while using WSL on Windows, then
open the Docker Desktop App in Windows, go to Settings -> Resources and ensure that your Linux distribution (e.g., Ubuntu) is enabled. See also [here](https://stackoverflow.com/questions/63497928/ubuntu-wsl-with-docker-could-not-be-found).
* If you are running into a "Permission denied" error, prepend `sudo` to the commands, i.e. `sudo docker-compose up --build` and `sudo docker-compose up`
* FileNotFoundError: Make sure you are inside `packages/diva-oracle` folder. Another reason might be that docker is not running. To check that, type `docker ps` in the command line. If this throws 
"Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?", then docker is not running. The command to start Docker depends on your operating system. If you are running on Windows and you have Docker Desktop already installed, simply open the application and try again. For other operating systems, please refer to this [resource](https://docs.docker.com/config/daemon/). 

# Running _without_ Docker

## Poetry installation and local development
1. Install poetry: 

* OSX / linux / bashonwindows installation instructions:
```
curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python -
```
* Windows powershell installation instructions:
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

## Trouble shooting
* If `poetry` is not recognized a valid command in your terminal (e.g., when running `poetry --version`), try to add the following path variable in windows `%USERPROFILE%\.poetry\bin`
* If it's still not working, try to run visual studio / the console in administrator mode

## Helpful links
* Python poetry docs: https://python-poetry.org/docs/

### Tellor Oracle details
