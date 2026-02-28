# LiDAR A1 – Packet Structure (Conceptual)

## 1. Data Transmission Model
LiDAR A1 sends data continuously over UART as a stream of bytes.
The ESP32 reads this stream and must detect valid packets.

## 2. Packet-Based Communication
Data is grouped into packets.
Each packet represents multiple distance measurements taken at different angles.

## 3. Typical Packet Content (Conceptual)
A packet usually contains:
- Header bytes (to indicate start of packet)
- Rotation / angle information
- Multiple distance samples
- Quality information
- Checksum (for validation)

## 4. Measurement Point Structure
Each measurement point includes:
- Angle (calculated or provided)
- Distance (in millimeters)
- Quality (signal strength)

## 5. Parsing Challenges
ESP32 must:
- Read byte-by-byte from UART
- Detect packet start
- Extract valid measurements
- Ignore corrupted data

## 6. Importance of Packet Parsing
Correct packet parsing is required before:
- Mapping
- Obstacle detection
- Navigation logic
