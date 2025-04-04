
#!/usr/bin/env python3
"""
Arduino to WebSocket Bridge

This script reads data from the Arduino's serial port and forwards it to a WebSocket server.
It can be used to bridge the gap between the Arduino and the web application.

Requirements:
- Python 3.6+
- pyserial (pip install pyserial)
- websocket-client (pip install websocket-client)
"""

import serial
import json
import websocket
import time
import argparse
from serial.tools import list_ports

def find_arduino_port():
    """Try to automatically find the Arduino's serial port."""
    arduino_ports = [
        p.device for p in list_ports.comports()
        if 'Arduino' in p.description or 'CH340' in p.description
    ]
    
    if not arduino_ports:
        return None
    return arduino_ports[0]

def main():
    parser = argparse.ArgumentParser(description='Arduino to WebSocket Bridge')
    parser.add_argument('--port', help='Serial port for Arduino')
    parser.add_argument('--baud', type=int, default=9600, help='Baud rate (default: 9600)')
    parser.add_argument('--ws', default='ws://localhost:8080', help='WebSocket server URL')
    args = parser.parse_args()
    
    # Try to find Arduino port if not specified
    port = args.port or find_arduino_port()
    if not port:
        print("Error: Arduino port not found. Please specify with --port.")
        print("Available ports:")
        for p in list_ports.comports():
            print(f"  {p.device} - {p.description}")
        return
    
    print(f"Connecting to Arduino on {port} at {args.baud} baud...")
    ser = serial.Serial(port, args.baud, timeout=1)
    
    print(f"Connecting to WebSocket server at {args.ws}...")
    ws = websocket.WebSocket()
    
    try:
        ws.connect(args.ws)
        print("WebSocket connection established!")
        
        print("Bridge running. Press Ctrl+C to stop.")
        while True:
            try:
                # Read line from Arduino
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8').strip()
                    if line:
                        try:
                            # Validate JSON
                            data = json.loads(line)
                            # Forward to WebSocket
                            ws.send(line)
                            print(f"Forwarded: {line}")
                        except json.JSONDecodeError:
                            print(f"Invalid JSON from Arduino: {line}")
                
                # Read from WebSocket (for bidirectional communication)
                try:
                    ws.settimeout(0.1)
                    message = ws.recv()
                    print(f"Received from server: {message}")
                    # Forward to Arduino if needed
                    # ser.write(f"{message}\n".encode())
                except websocket.WebSocketTimeoutException:
                    pass
                
                time.sleep(0.1)
                
            except websocket.WebSocketConnectionClosedException:
                print("WebSocket connection closed. Reconnecting...")
                try:
                    ws.connect(args.ws)
                    print("Reconnected!")
                except:
                    print("Reconnection failed. Retrying in 5 seconds...")
                    time.sleep(5)
            
    except KeyboardInterrupt:
        print("Bridge stopped by user.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ser.close()
        ws.close()
        print("Bridge shut down.")

if __name__ == "__main__":
    main()
