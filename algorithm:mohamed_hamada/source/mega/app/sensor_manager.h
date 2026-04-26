#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H
#include "../hal/ultrasonic.h"
#include "../hal/mpu6050_sensor.h"
#include "../hal/encoder.h"
#include "../com/uart_comm.h"

class SensorManager {
public:
  SensorManager();
  void begin();
  void update();
  SensorData getData();
private:
  Ultrasonic _ultraFront, _ultraLeft, _ultraRight, _ultraBack;
  MPU6050Sensor _mpu;
  Encoder _encLeft, _encRight;
  SensorData _data;
};
#endif