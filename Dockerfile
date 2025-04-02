FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application if it's a TypeScript project
# RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

RUN npx prisma generate

# Command to run the application
CMD ["npm", "run", "dev"]