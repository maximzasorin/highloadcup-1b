FROM node

WORKDIR /usr/app

# Copy app
COPY . .

# Install dependencies
RUN npm install

# Expose
CMD ["/bin/bash", "./scripts/expose.sh"]

EXPOSE 80