
# ==========================
# BUILD STAGE
# ==========================

FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

# Download Maven dependencies
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Build the Spring Boot application
RUN mvn clean package -DskipTests

# ==========================
# RUN STAGE
# ==========================

FROM eclipse-temurin:21-jre

# Install ffmpeg (needed to convert voice notes to OGG/Opus)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the generated Spring Boot JAR
COPY --from=build /app/target/*.jar app.jar

# Spring Boot application port
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-jar", "app.jar"]
