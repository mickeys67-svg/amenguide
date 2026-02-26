# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./
RUN npm install

COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_API_URL=https://amenguide-backend-775250805671.us-west1.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KAKAO_MAP_API_KEY=580811682bfec9eba52306aa2e6ec59a
ENV NEXT_PUBLIC_KAKAO_MAP_API_KEY=$NEXT_PUBLIC_KAKAO_MAP_API_KEY
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBtR-eFI7wSjLA6tOSJjw0Rdfwv9jGoFvs
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Next.js standalone output requires copying specific files
# Note: standalone includes node_modules and server.js
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 8080

CMD ["node", "server.js"]



