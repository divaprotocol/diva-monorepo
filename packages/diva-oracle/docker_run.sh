# build docker image
sudo docker build -t diva/oracle:latest .

# The below commands delete empty images tagged <none>
# comment out the below lines to stop this funcitonality
echo "deleting empty images"
docker rmi $(docker images --filter "dangling=true" -q --no-trunc) -f

sudo docker image ls

sudo docker run diva/oracle:latest