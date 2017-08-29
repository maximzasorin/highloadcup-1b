FROM node

WORKDIR /usr/app

# Update
RUN apt-get update -qq

# Install unzip
RUN apt-get install -y unzip

# Copy app
COPY . .

# Install dependencies
RUN npm install

# Expose
CMD ["/bin/bash", "./scripts/expose.sh"]

EXPOSE 80