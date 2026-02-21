# This root Dockerfile is a fallback to building the backend 
# if the Cloud Run trigger does not use cloudbuild.yaml.

FROM node:20-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
EXPOSE 8080
CMD ["node", "dist/main.js"]
