#ifndef ENCODER_H
#define ENCODER_H
#include <Arduino.h>

class Encoder {
public:
  Encoder(uint8_t pinA, uint8_t pinB = 0);   // pinB optional, currently not used
  void begin();
  volatile long count;                   // incremented in ISR
  void reset();
  static Encoder* leftInstance;          // for ISR routing
  static Encoder* rightInstance;
private:
  uint8_t _pinA;
  static void isrLeft();
  static void isrRight();
};
#endif