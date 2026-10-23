FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY src src
RUN chmod +x ./mvnw && ./mvnw -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC"
COPY --from=build /workspace/target/erp-*.jar /app/erp.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/erp.jar"]
