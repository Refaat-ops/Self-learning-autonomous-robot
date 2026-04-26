#ifndef MPU6050_SENSOR_H
#define MPU6050_SENSOR_H
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

class MPU6050Sensor {
public:
  MPU6050Sensor();
  bool begin();
  float getYaw();
  float getGyroZ();
  void resetYaw();
private:
  Adafruit_MPU6050 _mpu;
  unsigned long _lastUpdate;
  float _yaw;
  bool _init;
};

#endif