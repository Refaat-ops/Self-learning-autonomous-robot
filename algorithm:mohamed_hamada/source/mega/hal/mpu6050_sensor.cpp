#include "mpu6050_sensor.h"

MPU6050Sensor::MPU6050Sensor() : _lastUpdate(0), _yaw(0), _init(false) {}

bool MPU6050Sensor::begin() {
  if (!_mpu.begin()) return false;
  _mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  _mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  _mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  _lastUpdate = micros();
  _init = true;
  return true;
}

float MPU6050Sensor::getYaw() {
  if (!_init) return 0;
  unsigned long now = micros();
  float dt = (now - _lastUpdate) / 1000000.0f;
  _lastUpdate = now;
  sensors_event_t a, g, temp;
  _mpu.getEvent(&a, &g, &temp);
  _yaw += g.gyro.z * dt;
  return _yaw;
}

float MPU6050Sensor::getGyroZ() {
  if (!_init) return 0;
  sensors_event_t a, g, temp;
  _mpu.getEvent(&a, &g, &temp);
  return g.gyro.z;
}

void MPU6050Sensor::resetYaw() {
  _yaw = 0;
}