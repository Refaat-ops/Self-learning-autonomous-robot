# ESP32 – LiDAR A1 UART Raw Data Reader (Explanation)

## 1. Task Objective
The goal of this task is to prepare ESP32 to read raw data from LiDAR A1 using UART communication.

Since hardware is not yet available, the implementation focuses on:
- Understanding data flow
- Preparing hardware-ready code
- Simulating LiDAR behavior

## 2. Project Workflow
The implementation was divided into clear stages:
1. Documentation of LiDAR raw data and packet structure
2. Simulation using fake LiDAR data
3. ESP32 UART skeleton code ready for real hardware

## 3. UART Communication Setup
- ESP32 uses `Serial2` for LiDAR communication
- Baud rate: 115200
- Communication mode: 8 data bits, no parity, 1 stop bit (8N1)

### Pin Configuration
- LiDAR TX → ESP32 RX (GPIO 16)
- LiDAR RX → ESP32 TX (GPIO 17)

## 4. UART Reader Logic
The ESP32 continuously checks if data is available on `Serial2`.
Each incoming byte is read and printed in HEX format for debugging.

This allows:
- Verifying communication
- Inspecting raw byte stream
- Preparing for packet parsing

## 5. Simulation Phase
Before hardware availability:
- Fake LiDAR data was used
- ESP32 logic was tested using structured sample data
- The same parsing logic can later be reused with real UART input

## 6. Next Development Step
Once LiDAR A1 hardware is available:
- Replace HEX debug printing with packet parsing
- Extract angle, distance, and quality values
- Integrate data into mapping and navigation modules
