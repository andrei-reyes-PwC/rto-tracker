# Spring Backend

Standalone Spring Boot REST API for the RTO Tracker. See `PROJECT_NOTES.md` for the package map and current implementation state.

## Requirements

- Java 25 or later
- Maven 3.6.3 or later

## Run

From this directory, start the app with:

```powershell
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. Request `GET http://localhost:8080/api/hello` for a JSON response:

```json
{"message":"RTO Tracker API is running"}
```

Build a runnable JAR with `mvn package`, then run it with `java -jar target/spring-backend-0.0.1-SNAPSHOT.jar`.
