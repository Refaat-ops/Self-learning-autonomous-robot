#include "motor.h"

Motor::Motor(uint8_t pwm, uint8_t in1, uint8_t in2)
    : _pwm(pwm), _in1(in1), _in2(in2) {}

void Motor::begin() {
  pinMode(_pwm, OUTPUT);
  pinMode(_in1, OUTPUT);
  pinMode(_in2, OUTPUT);
  digitalWrite(_in1, LOW);
  digitalWrite(_in2, LOW);
  analogWrite(_pwm, 0);
}

void Motor::setSpeed(int16_t speed) {
  bool forward = speed >= 0;
  uint8_t pwm = constrain(abs(speed), 0, 255);
  digitalWrite(_in1, forward ? HIGH : LOW);
  digitalWrite(_in2, forward ? LOW : HIGH);
  analogWrite(_pwm, pwm);
}