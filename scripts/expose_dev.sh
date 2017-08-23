#/bin/bash

mkdir -p /data/initial
unzip -o /tmp/data/data.zip -d /data/initial &> /dev/null

npm run dev