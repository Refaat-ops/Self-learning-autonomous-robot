# LiDAR A1 – Raw Data Overview

## 1. What is LiDAR A1?
LiDAR A1 is a 2D laser scanner used to measure distance and detect obstacles by emitting laser pulses and measuring their return time.

## 2. Communication Method
- Interface: UART (Serial)
- Typical baud rate: 115200
- Data stream: Continuous packets

## 3. Raw Data Output
Each measurement point includes:
- Angle (degree)
- Distance (millimeters)
- Quality (signal strength)

## 4. Data Flow Concept
LiDAR continuously sends scan data as a stream of packets.
Each packet contains multiple measurement points covering a small angle range.

## 5. Why Raw Data Parsing is Needed
ESP32 must:
- Read serial bytes
- Detect packet boundaries
- Extract distance and angle
- Validate data integrity

This step is critical before any mapping or navigation logic.
