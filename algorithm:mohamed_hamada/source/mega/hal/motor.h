#ifndef MOTOR_H
#define MOTOR_H
#include <Arduino.h>

class Motor {
public:
  Motor(uint8_t pwm, uint8_t in1, uint8_t in2);
  void begin();
  void setSpeed(int16_t speed);  // -255..255
private:
  uint8_t _pwm, _in1, _in2;
};
#endif