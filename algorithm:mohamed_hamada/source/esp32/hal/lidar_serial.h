#ifndef LIDAR_SERIAL_H
#define LIDAR_SERIAL_H
#include <Arduino.h>

class LidarSerial {
public:
  void begin(HardwareSerial &serial, int baud, int8_t rx, int8_t tx);
  bool readDistance(float &dist_m);
private:
  HardwareSerial *_stream;
};

#endif