#include "lidar_serial.h"

void LidarSerial::begin(HardwareSerial &serial, int baud, int8_t rx, int8_t tx) {
  _stream = &serial;
  _stream->begin(baud, SERIAL_8N1, rx, tx);
}

bool LidarSerial::readDistance(float &dist_m) {
  if (_stream->available() >= 9) {
    uint8_t header[2];
    header[0] = _stream->read();
    header[1] = _stream->read();
    if (header[0] == 0x59 && header[1] == 0x59) {
      uint8_t buf[7];
      _stream->readBytes(buf, 7);
      uint16_t dist = ((uint16_t)buf[1] << 8) | buf[0];
      dist_m = dist / 1000.0f;
      return true;
    }
  }
  return false;
}