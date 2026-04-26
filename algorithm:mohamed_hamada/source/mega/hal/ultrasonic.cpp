#include "ultrasonic.h"

Ultrasonic* Ultrasonic::_instance = nullptr;

Ultrasonic::Ultrasonic(uint8_t trigPin, uint8_t echoPin)
    : _trig(trigPin), _echo(echoPin), _echoDone(false),
      _pulseStart(0), _pulseEnd(0), _lastTriggerTime(0), _distance(0.0) {}

void Ultrasonic::begin() {
  pinMode(_trig, OUTPUT);
  digitalWrite(_trig, LOW);
  pinMode(_echo, INPUT);
  _instance = this;
  attachInterrupt(digitalPinToInterrupt(_echo), echoISR, CHANGE);
}

void Ultrasonic::echoISR() {
  if (!_instance) return;
  if (digitalRead(_instance->_echo) == HIGH) {
    _instance->_pulseStart = micros();
  } else {
    _instance->_pulseEnd = micros();
    _instance->_echoDone = true;
  }
}

void Ultrasonic::update() {
  // trigger periodically (every ~60ms)
  if (millis() - _lastTriggerTime >= 60) {
    _lastTriggerTime = millis();
    digitalWrite(_trig, LOW);
    delayMicroseconds(2);
    digitalWrite(_trig, HIGH);
    delayMicroseconds(10);
    digitalWrite(_trig, LOW);
    _echoDone = false;
  }
  // If a new measurement arrived, compute distance
  if (_echoDone) {
    noInterrupts();
    unsigned long duration = _pulseEnd - _pulseStart;
    _echoDone = false;
    interrupts();
    if (duration > 0 && duration < 30000) { // valid range
      _distance = duration * 0.0343f / 2.0f;
    }
  }
}

float Ultrasonic::getDistanceCm() {
  return _distance;
}