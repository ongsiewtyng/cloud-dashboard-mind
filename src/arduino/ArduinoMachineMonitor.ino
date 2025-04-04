
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

#include <ArduinoJson.h>

// Your machine monitoring pins
const int machineSensorPin = 2;  
unsigned long lastTimestamp = 0;
unsigned long runTime = 0;
boolean machineState = false;

void setup() {
  Serial.begin(9600);
  pinMode(machineSensorPin, INPUT);
  Serial.println("Machine monitoring started");
}

void loop() {
  // Read machine state
  boolean currentState = digitalRead(machineSensorPin) == HIGH;
  
  // Update runtime
  runTime += 1;
  
  // Get current timestamp (millis since start)
  unsigned long currentTimestamp = millis();
  
  // Check if state changed or if 5 seconds passed
  if (currentState != machineState || currentTimestamp - lastTimestamp >= 5000) {
    machineState = currentState;
    lastTimestamp = currentTimestamp;
    
    // Create JSON document
    StaticJsonDocument<128> doc;
    doc["timestamp"] = currentTimestamp;
    doc["machineState"] = machineState ? "True" : "False";
    doc["runTime"] = runTime;
    
    // Serialize JSON to Serial
    serializeJson(doc, Serial);
    Serial.println();
  }
  
  delay(1000);  // Update every second
}

/*
 * WebSocket Version - Uncomment this version if you have ESP8266/ESP32
 * and want to connect directly to the server without a bridge application.
 */
/*
#include <ESP8266WiFi.h>
#include <WebSocketClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* websocketServer = "your-dashboard-url.com";
const int websocketPort = 80;
const char* websocketPath = "/ws";

WiFiClient client;
WebSocketClient webSocketClient;
const int machineSensorPin = 2;
unsigned long lastTimestamp = 0;
unsigned long runTime = 0;
boolean machineState = false;

void setup() {
  Serial.begin(9600);
  pinMode(machineSensorPin, INPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  
  // Connect to WebSocket server
  if (client.connect(websocketServer, websocketPort)) {
    Serial.println("Connected to WebSocket server");
    webSocketClient.path = websocketPath;
    webSocketClient.host = websocketServer;
    if (webSocketClient.handshake(client)) {
      Serial.println("WebSocket handshake successful");
    } else {
      Serial.println("WebSocket handshake failed");
    }
  } else {
    Serial.println("Connection to WebSocket server failed");
  }
}

void loop() {
  if (client.connected()) {
    // Read machine state
    boolean currentState = digitalRead(machineSensorPin) == HIGH;
    
    // Update runtime
    runTime += 1;
    
    // Get current timestamp
    unsigned long currentTimestamp = millis();
    
    // Check if state changed or if 5 seconds passed
    if (currentState != machineState || currentTimestamp - lastTimestamp >= 5000) {
      machineState = currentState;
      lastTimestamp = currentTimestamp;
      
      // Create JSON document
      StaticJsonDocument<128> doc;
      doc["timestamp"] = currentTimestamp;
      doc["machineState"] = machineState ? "True" : "False";
      doc["runTime"] = runTime;
      
      // Serialize JSON to string
      String jsonData;
      serializeJson(doc, jsonData);
      
      // Send JSON data over WebSocket
      webSocketClient.sendData(jsonData);
      Serial.println("Data sent: " + jsonData);
    }
    
    // Check for WebSocket server data
    String data;
    if (webSocketClient.getData(data)) {
      Serial.println("Received data: " + data);
    }
  } else {
    Serial.println("Connection to WebSocket server lost. Reconnecting...");
    if (client.connect(websocketServer, websocketPort)) {
      webSocketClient.path = websocketPath;
      webSocketClient.host = websocketServer;
      if (webSocketClient.handshake(client)) {
        Serial.println("WebSocket handshake successful");
      }
    }
  }
  
  delay(1000);  // Update every second
}
*/
