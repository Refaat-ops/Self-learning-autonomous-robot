#include "encoder.h"

Encoder* Encoder::leftInstance = nullptr;
Encoder* Encoder::rightInstance = nullptr;

Encoder::Encoder(uint8_t pinA, uint8_t pinB) : _pinA(pinA), count(0) {}

void Encoder::begin() {
  pinMode(_pinA, INPUT_PULLUP);
  if (this == leftInstance) {
    attachInterrupt(digitalPinToInterrupt(_pinA), isrLeft, CHANGE);
  } else if (this == rightInstance) {
    attachInterrupt(digitalPinToInterrupt(_pinA), isrRight, CHANGE);
  }
}

void Encoder::reset() {
  count = 0;
}

void Encoder::isrLeft() {
  if (leftInstance) leftInstance->count++;
}

void Encoder::isrRight() {
  if (rightInstance) rightInstance->count++;
}