#include "sensor_manager.h"

SensorManager::SensorManager()
    : _ultraFront(30, 31), _ultraLeft(36, 37),
      _ultraRight(34, 35), _ultraBack(32, 33),
      _encLeft(18), _encRight(19) {}

void SensorManager::begin() {
  Wire.begin();
  _mpu.begin();

  Encoder::leftInstance = &_encLeft;
  Encoder::rightInstance = &_encRight;
  _encLeft.begin();
  _encRight.begin();

  _ultraFront.begin();
  _ultraLeft.begin();
  _ultraRight.begin();
  _ultraBack.begin();
}

void SensorManager::update() {
  _ultraFront.update();
  _ultraLeft.update();
  _ultraRight.update();
  _ultraBack.update();

  _data.ultra_front = static_cast<uint16_t>(_ultraFront.getDistanceCm() * 10);
  _data.ultra_left  = static_cast<uint16_t>(_ultraLeft.getDistanceCm() * 10);
  _data.ultra_right = static_cast<uint16_t>(_ultraRight.getDistanceCm() * 10);
  _data.ultra_back  = static_cast<uint16_t>(_ultraBack.getDistanceCm() * 10);

  _data.imu_yaw = static_cast<int16_t>(_mpu.getYaw() * 100); // 0.01 rad

  _data.enc_left  = _encLeft.count;
  _data.enc_right = _encRight.count;

  int raw = analogRead(A0);
  _data.battery_mv = (uint16_t)(raw * (5000.0 / 1023.0) * 4);
}

SensorData SensorManager::getData() {
  return _data;
}