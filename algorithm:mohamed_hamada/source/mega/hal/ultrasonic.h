#ifndef ULTRASONIC_H
#define ULTRASONIC_H
#include <Arduino.h>

class Ultrasonic {
public:
  Ultrasonic(uint8_t trigPin, uint8_t echoPin);
  void begin();
  float getDistanceCm();         // last valid distance
  void update();                 // call in loop to check echo timeout

private:
  uint8_t _trig, _echo;
  volatile bool _echoDone;
  volatile unsigned long _pulseStart;
  volatile unsigned long _pulseEnd;
  unsigned long _lastTriggerTime;
  float _distance;
  static void echoISR();
  static Ultrasonic* _instance;  // for ISR usage
};

#endif