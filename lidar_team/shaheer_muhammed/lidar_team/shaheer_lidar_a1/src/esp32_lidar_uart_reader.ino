// ESP32 LiDAR A1 UART Reader (Hardware-Ready Skeleton)

#define LIDAR_RX 16   // ESP32 RX pin (connect to LiDAR TX)
#define LIDAR_TX 17   // ESP32 TX pin (connect to LiDAR RX)

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 LiDAR UART Reader Started");

  Serial2.begin(115200, SERIAL_8N1, LIDAR_RX, LIDAR_TX);
}

void loop() {
  while (Serial2.available()) {
    uint8_t incomingByte = Serial2.read();

    // Temporary: print raw byte in HEX
    Serial.print("0x");
    Serial.print(incomingByte, HEX);
    Serial.print(" ");
  }
}
