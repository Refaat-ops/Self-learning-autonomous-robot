// ESP32 LiDAR Simulation Reader
// This code simulates reading LiDAR raw data without hardware

struct LidarPoint {
  float angle;
  int distance;
  int quality;
};

LidarPoint fakeData[] = {
  {0.0, 1200, 15},
  {1.0, 1185, 14},
  {2.0, 1170, 13},
  {3.0, 1150, 15},
  {4.0, 1135, 16},
  {5.0, 1120, 14},
  {6.0, 1100, 15},
  {7.0, 1085, 14},
  {8.0, 1070, 13},
  {9.0, 1050, 15}
};

int dataSize = sizeof(fakeData) / sizeof(fakeData[0]);

void setup() {
  Serial.begin(115200);
  Serial.println("Starting LiDAR Simulation...");
}

void loop() {
  for (int i = 0; i < dataSize; i++) {
    Serial.print("Angle: ");
    Serial.print(fakeData[i].angle);
    Serial.print(" deg | Distance: ");
    Serial.print(fakeData[i].distance);
    Serial.print(" mm | Quality: ");
    Serial.println(fakeData[i].quality);
    delay(500);
  }

  Serial.println("Scan cycle complete\n");
  delay(2000);
}
