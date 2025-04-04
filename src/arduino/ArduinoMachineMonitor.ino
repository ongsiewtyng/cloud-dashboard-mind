
/*
 * MCM Dashboard - Arduino Machine Monitor
 * 
 * This sketch allows your Arduino to monitor a machine's status and
 * send data to the MCM Dashboard web application.
 * 
 * Required Libraries:
 * - ArduinoJson: Install via Arduino Library Manager
 * - (Optional) WebSocketClient: For direct WebSocket communication
 */

#include <WiFiS3.h>
#include <ArduinoHttpClient.h>

const char* ssid = "VA Guest 5Ghz";
const char* password = "22335599";
const char* server = "cloud-dashboard-mind.vercel.app";
const int port = 80;
const int sensorPin = A0;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, server, port);

struct DataRecord {
    unsigned long timestamp;
    bool machineState;
    unsigned long runTime;
};

const int BUFFER_SIZE = 10;  // Store last 10 records before sending
DataRecord dataBuffer[BUFFER_SIZE];
int bufferIndex = 0;

bool machineState = false;
unsigned long startTime = 0;
unsigned long totalRunTime = 0;

void setup() {
    Serial.begin(115200);
    while (!Serial);

    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi!");
}

void loop() {
    bool currentState = readSensor();
    if (currentState != machineState) {
        machineState = currentState;
        updateRunTime();
        logData(machineState, totalRunTime);
    }

    if (bufferIndex == BUFFER_SIZE) {
        sendData();
        bufferIndex = 0;  // Reset buffer after sending
    }

    delay(5000);
}

bool readSensor() {
    int sensorValue = analogRead(sensorPin);
    Serial.print("Sensor Value: ");
    Serial.println(sensorValue);
    return sensorValue > 500;
}

void updateRunTime() {
    if (machineState) {
        startTime = millis();
    } else {
        totalRunTime += (millis() - startTime) / 1000;
    }
}

void logData(bool state, unsigned long runtime) {
    dataBuffer[bufferIndex].timestamp = millis();
    dataBuffer[bufferIndex].machineState = state;
    dataBuffer[bufferIndex].runTime = runtime;
    bufferIndex++;

    Serial.println("Data logged in memory.");
}

void sendData() {
    String jsonData = "[";
    for (int i = 0; i < BUFFER_SIZE; i++) {
        jsonData += "{\"timestamp\": " + String(dataBuffer[i].timestamp) +
                    ", \"machineState\": " + String(dataBuffer[i].machineState) +
                    ", \"runTime\": " + String(dataBuffer[i].runTime) + "}";
        if (i < BUFFER_SIZE - 1) jsonData += ",";
    }
    jsonData += "]";

    Serial.println("Sending data: " + jsonData);

    client.beginRequest();
    client.post("/data");
    client.sendHeader("Content-Type", "application/json");
    client.sendHeader("Content-Length", jsonData.length());
    client.beginBody();
    client.print(jsonData);
    client.endRequest();

    int statusCode = client.responseStatusCode();
    String response = client.responseBody();
    Serial.println("Response: "+response);
}
