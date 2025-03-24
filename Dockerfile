FROM node:20-alpine

WORKDIR /app

# Copy package files and tsconfig
COPY package*.json tsconfig.json ./

# Install dependencies WITHOUT running the prepare script
RUN npm ci --ignore-scripts

# Copy the rest of the code
COPY . .

# Build TypeScript code explicitly
RUN npm run build

# Make sure the server script is executable
RUN chmod +x dist/sse-server.js

# Expose the SSE port
EXPOSE 3337

# Command to run the server
CMD ["npm", "run", "start:sse"] 