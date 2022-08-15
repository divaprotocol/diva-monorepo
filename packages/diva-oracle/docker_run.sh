
# The below commands delete empty images tagged <none>
# comment out the below lines to stop this funcitonality
#echo "deleting empty images"
#docker rmi $(docker images --filter "dangling=true" -q --no-trunc) -f

docker-compose build
docker-compose up
