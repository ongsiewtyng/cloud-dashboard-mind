
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
const int sensorPin = 2;
const int ledPin = LED_BUILTIN;
const int debounceDelay = 50; // Debounce time in milliseconds to avoid connection issues

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
unsigned long lastWiFiCheckTime = 0;
bool isConfigured = false;

// WiFi scanning and status
int wifiStatus = WL_IDLE_STATUS;
int lastSignalStrength = 0;

void setup() {
    Serial.begin(115200);
    while (!Serial && millis() < 5000); // Wait for serial to connect but timeout after 5 seconds

    pinMode(sensorPin, INPUT_PULLUP);
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
        // Check WiFi connection and send status every 10 seconds
        if (millis() - lastWiFiCheckTime >= 10000) {
            lastWiFiCheckTime = millis();
            checkWiFiStatus();
        }

        // Check WiFi connection
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("Reconnecting to WiFi...");
            connectToWiFi();
        }

        // Read sensor regardless of WiFi connection - this ensures button presses are always detected
        // We'll read more frequently (every 50ms) to ensure responsive button detection
        if (millis() - lastReadTime >= 50) {
            lastReadTime = millis();
            bool currentState = readSensor();

            if (currentState != machineState) {
                machineState = currentState;
                updateRunTime();
                logData(machineState, totalRunTime);

                // Send button state change immediately over serial
                StaticJsonDocument<128> stateChangeJson;
                stateChangeJson["type"] = "state_change";
                stateChangeJson["state"] = machineState ? "on" : "off";
                stateChangeJson["timestamp"] = millis();
                String jsonOutput;
                serializeJson(stateChangeJson, jsonOutput);
                Serial.println(jsonOutput);
            }

            // Blink LED to indicate active monitoring (faster when button is pressed)
            if (machineState) {
                // Fast blink when button is pressed
                digitalWrite(ledPin, (millis() / 100) % 2);
            } else {
                // Slow blink when idle
                digitalWrite(ledPin, (millis() / 500) % 2);
            }
        }

        // Send data buffer if it's full or it's been more than 10 seconds (reduced from 30)
        if (WiFi.status() == WL_CONNECTED &&
            (bufferIndex == BUFFER_SIZE || (millis() - lastSendTime >= 10000 && bufferIndex > 0))) {
            sendData();
            lastSendTime = millis();
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
        } else if (command == "SCAN_WIFI") {
            // Scan for available networks and return results
            scanWiFiNetworks();
        } else if (command == "WIFI_STATUS") {
            // Report WiFi status
            sendWiFiStatus();
        }
    }
}

void scanWiFiNetworks() {
    Serial.println("Scanning WiFi networks...");

    int numNetworks = WiFi.scanNetworks();

    Serial.print("Found ");
    Serial.print(numNetworks);
    Serial.println(" networks");

    if (numNetworks > 0) {
        // Create a JSON array with network info
        StaticJsonDocument<1024> jsonDoc;
        JsonArray networks = jsonDoc.createNestedArray("networks");

        for (int i = 0; i < numNetworks; i++) {
            JsonObject network = networks.createNestedObject();
            network["ssid"] = WiFi.SSID(i);
            network["rssi"] = WiFi.RSSI(i);
            network["encryption"] = WiFi.encryptionType(i);
        }

        String networksList;
        serializeJson(jsonDoc, networksList);
        Serial.println(networksList);
    }
}

void checkWiFiStatus() {
    int status = WiFi.status();
    int rssi = 0;

    if (status == WL_CONNECTED) {
        rssi = WiFi.RSSI();
        lastSignalStrength = rssi;
    }

    if (status != wifiStatus) {
        wifiStatus = status;
        sendWiFiStatus();
    } else if (abs(rssi - lastSignalStrength) > 5) {
        // Signal strength changed significantly
        lastSignalStrength = rssi;
        sendWiFiStatus();
    }
}

void sendWiFiStatus() {
    StaticJsonDocument<256> jsonDoc;

    jsonDoc["type"] = "wifi_status";
    jsonDoc["connected"] = (WiFi.status() == WL_CONNECTED);

    if (WiFi.status() == WL_CONNECTED) {
        jsonDoc["ssid"] = ssid;
        jsonDoc["ip"] = WiFi.localIP().toString();
        jsonDoc["signal_strength"] = WiFi.RSSI();
    }

    String statusMessage;
    serializeJson(jsonDoc, statusMessage);
    Serial.println(statusMessage);
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

        // Send status update
        sendWiFiStatus();
    } else {
        Serial.println("\nFailed to connect to WiFi!");
        digitalWrite(ledPin, LOW);
    }
}

bool readSensor() {
    static bool lastButtonState = HIGH;     // Last reading from input pin
    static bool debouncedState = false;     // Debounced button state
    static unsigned long lastDebounceTime = 0;

    bool reading = digitalRead(sensorPin);

    if (reading != lastButtonState) {
        lastDebounceTime = millis();
    }

    if ((millis() - lastDebounceTime) > debounceDelay) {
        // If the button state has been stable for debounceDelay, take it as real
        if (reading != debouncedState) {
            debouncedState = reading == LOW; // LOW means button is pressed
            Serial.println(debouncedState ? "Button Pressed (ON)" : "Button Released (OFF)");

            // Send a structured sensor reading JSON for better processing
            StaticJsonDocument<128> sensorJson;
            sensorJson["type"] = "sensor_reading";
            sensorJson["value"] = debouncedState ? 1023 : 0; // Use 1023 for pressed, 0 for released
            sensorJson["active"] = debouncedState;
            sensorJson["timestamp"] = millis();

            String jsonString;
            serializeJson(sensorJson, jsonString);
            Serial.println(jsonString);

            // Also log in the old format for backward compatibility
            Serial.print("Sensor Value: ");
            Serial.println(debouncedState ? 1023 : 0);
        }
    }

    lastButtonState = reading;
    return debouncedState; // true when pressed
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
