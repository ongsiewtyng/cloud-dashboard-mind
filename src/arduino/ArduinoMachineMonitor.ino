
/*
 * MCM Dashboard - Arduino Machine Monitor
 * 
 * This sketch allows your Arduino to monitor a machine's status and
 * send data to the MCM Dashboard web application via WiFi.
 * 
 * Required Libraries:
 * - ArduinoJson: Install via Arduino Library Manager
 * - WiFiS3 (for Arduino boards with built-in WiFi)
 */

#include <WiFiS3.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// WiFi credentials - these will be configurable through the dashboard
char ssid[64] = ""; // Will be set via dashboard
char password[64] = ""; // Will be set via dashboard

// Server configuration
const char* serverHost = "cloud-dashboard-mind.vercel.app";
const int serverPort = 80;
const char* apiEndpoint = "/api/arduino-data";

// Machine monitoring pins
const int sensorPin = A0;
const int ledPin = LED_BUILTIN;

// WiFi and HTTP client
WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverHost, serverPort);

// Data buffer for storing readings before sending
struct DataRecord {
    unsigned long timestamp;
    bool machineState;
    unsigned long runTime;
};

const int BUFFER_SIZE = 10;  // Store records before sending
DataRecord dataBuffer[BUFFER_SIZE];
int bufferIndex = 0;

// Machine state tracking
bool machineState = false;
unsigned long startTime = 0;
unsigned long totalRunTime = 0;
unsigned long lastSendTime = 0;
unsigned long lastReadTime = 0;
bool isConfigured = false;

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 5000); // Wait for serial to connect but timeout after 5 seconds
    
    pinMode(ledPin, OUTPUT);
    digitalWrite(ledPin, LOW);
    
    Serial.println(F("Arduino Machine Monitor"));
    Serial.println(F("Waiting for WiFi configuration..."));
    Serial.println(F("Send configuration in format: WIFI:SSID:PASSWORD"));
}

void loop() {
    // Check for configuration commands from serial
    checkForConfig();
    
    // Only proceed if WiFi is configured
    if (isConfigured) {
        // Check WiFi connection
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("Reconnecting to WiFi...");
            connectToWiFi();
        }
        
        // Read sensor and update state if connected
        if (WiFi.status() == WL_CONNECTED) {
            // Read sensor every second
            if (millis() - lastReadTime >= 1000) {
                lastReadTime = millis();
                bool currentState = readSensor();
                
                if (currentState != machineState) {
                    machineState = currentState;
                    updateRunTime();
                    logData(machineState, totalRunTime);
                }
                
                // Blink LED to indicate active monitoring
                digitalWrite(ledPin, !digitalRead(ledPin));
            }
            
            // Send data buffer if it's full or it's been more than 30 seconds
            if (bufferIndex == BUFFER_SIZE || (millis() - lastSendTime >= 30000 && bufferIndex > 0)) {
                sendData();
                lastSendTime = millis();
            }
        }
    }
}

void checkForConfig() {
    if (Serial.available()) {
        String command = Serial.readStringUntil('\n');
        command.trim();
        
        // Parse WIFI:SSID:PASSWORD command
        if (command.startsWith("WIFI:")) {
            int firstColon = command.indexOf(':', 5);
            if (firstColon > 5) {
                String newSSID = command.substring(5, firstColon);
                String newPassword = command.substring(firstColon + 1);
                
                // Store credentials
                newSSID.toCharArray(ssid, 64);
                newPassword.toCharArray(password, 64);
                
                Serial.print("New WiFi configuration: SSID=");
                Serial.println(ssid);
                
                // Connect with new credentials
                isConfigured = true;
                connectToWiFi();
            }
        }
    }
}

void connectToWiFi() {
    Serial.print("Connecting to WiFi network: ");
    Serial.println(ssid);
    
    WiFi.disconnect();
    delay(100);
    WiFi.begin(ssid, password);
    
    // Try to connect for 20 seconds
    int attemptCount = 0;
    while (WiFi.status() != WL_CONNECTED && attemptCount < 20) {
        delay(1000);
        Serial.print(".");
        attemptCount++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nConnected to WiFi!");
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
        digitalWrite(ledPin, HIGH); // Solid LED when connected
    } else {
        Serial.println("\nFailed to connect to WiFi!");
        digitalWrite(ledPin, LOW);
    }
}

bool readSensor() {
    int sensorValue = analogRead(sensorPin);
    // Serial.print("Sensor Value: "); // Uncomment for debugging
    // Serial.println(sensorValue);    // Uncomment for debugging
    return sensorValue > 500; // Threshold value (adjust as needed)
}

void updateRunTime() {
    if (machineState) {
        startTime = millis();
    } else if (startTime > 0) {
        totalRunTime += (millis() - startTime) / 1000;
    }
}

void logData(bool state, unsigned long runtime) {
    dataBuffer[bufferIndex].timestamp = millis();
    dataBuffer[bufferIndex].machineState = state;
    dataBuffer[bufferIndex].runTime = runtime;
    bufferIndex++;
    
    Serial.print("Data logged: state=");
    Serial.print(state ? "Running" : "Stopped");
    Serial.print(", runtime=");
    Serial.println(runtime);
}

void sendData() {
    // Create JSON array with the buffer data
    StaticJsonDocument<1024> jsonDoc;
    JsonArray dataArray = jsonDoc.to<JsonArray>();
    
    for (int i = 0; i < bufferIndex; i++) {
        JsonObject dataPoint = dataArray.createNestedObject();
        dataPoint["timestamp"] = dataBuffer[i].timestamp;
        dataPoint["machineState"] = dataBuffer[i].machineState ? "True" : "False";
        dataPoint["runTime"] = dataBuffer[i].runTime;
    }
    
    // Serialize JSON
    String jsonPayload;
    serializeJson(jsonDoc, jsonPayload);
    
    Serial.print("Sending data: ");
    Serial.println(jsonPayload);
    
    // Send HTTP POST request
    client.beginRequest();
    client.post(apiEndpoint);
    client.sendHeader("Content-Type", "application/json");
    client.sendHeader("Content-Length", jsonPayload.length());
    client.beginBody();
    client.print(jsonPayload);
    client.endRequest();
    
    // Check response
    int statusCode = client.responseStatusCode();
    String response = client.responseBody();
    
    Serial.print("Response code: ");
    Serial.println(statusCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    // Reset buffer after sending
    bufferIndex = 0;
}
