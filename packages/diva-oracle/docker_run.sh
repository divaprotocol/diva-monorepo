
# The below commands delete empty images tagged <none>
# comment out the below lines to stop this funcitonality
#echo "deleting empty images"
#docker rmi $(docker images --filter "dangling=true" -q --no-trunc) -f

docker-compose build
# -d is for detached mode, this will persist the docker image upon closing shell
docker-compose up -d
# follow logs in detached mode
docker logs -f Diva-tellor-oracle