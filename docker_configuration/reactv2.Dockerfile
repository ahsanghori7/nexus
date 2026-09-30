# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml ./

# Copy .npmrc file
COPY .npmrc ./

# Install pnpm globally
RUN npm install -g pnpm

# Install project dependencies
RUN pnpm install

# Remove .npmrc file
RUN rm .npmrc

# Copy the rest of the project files to the working directory
COPY . .

# Build the project
RUN pnpm run build

# Expose port 3002 in the container
EXPOSE 3002

# Define the command to run the app using CMD which defines your runtime
CMD ["pnpm", "run", "dev"]
