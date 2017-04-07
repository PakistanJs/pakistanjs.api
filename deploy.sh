echo "Copying files to api droplet ..."
rsync -r --delete-after --quiet $TRAVIS_BUILD_DIR root@139.59.124.114:www

echo "Done copying!"

echo "Restarting server"

ssh root@139.59.124.114 "pm2 kill; cd www/pakistanjs.api; pm2 start server.js"

echo "App is running!"
