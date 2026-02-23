FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api
CMD ["npm", "run", "dev"]
