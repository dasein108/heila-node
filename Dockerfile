# Stage 1: Build the application
FROM node:22 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

RUN npm install -g typescript

# Install dependencies
RUN npm install

# Copy all files to perform tsc
COPY . .

# Compile TypeScript code
RUN npm run build

# Stage 2: Run the application
FROM node:22 AS runtime

# Set the working directory
WORKDIR /usr/src/app

# Copy only the dist directory from the build stage
COPY --from=build /usr/src/app/dist ./dist

COPY --from=build /usr/src/app/peer.json ./peer.json

# Copy package.json and package-lock.json for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Set the command to run the application
CMD ["node", "dist/index.js"]
