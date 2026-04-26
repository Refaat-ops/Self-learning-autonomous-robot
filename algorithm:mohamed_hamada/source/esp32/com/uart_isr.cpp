#include "uart_isr.h"

HardwareSerial *UARTISR::_serial = nullptr;
QueueHandle_t UARTISR::_rxQueue = nullptr;

void UARTISR::begin(HardwareSerial &serial, int baud, int8_t rxPin, int8_t txPin) {
  _serial = &serial;
  _serial->begin(baud, SERIAL_8N1, rxPin, txPin);
  _rxQueue = xQueueCreate(256, sizeof(uint8_t));
  _serial->onReceive([]() {
    while (_serial->available()) {
      uint8_t b = _serial->read();
      BaseType_t xHigherPriorityTaskWoken = pdFALSE;
      xQueueSendFromISR(_rxQueue, &b, &xHigherPriorityTaskWoken);
      if (xHigherPriorityTaskWoken) portYIELD_FROM_ISR();
    }
  });
}

bool UARTISR::getSensorData(SensorPacket &pkt, TickType_t timeout) {
  static uint8_t buffer[sizeof(SensorPacket) + 3];
  static uint8_t idx = 0;
  static enum { WAIT_SYNC, WAIT_TYPE, WAIT_DATA, WAIT_CKSUM } state = WAIT_SYNC;

  uint8_t b;
  while (xQueueReceive(_rxQueue, &b, timeout) == pdTRUE) {
    switch (state) {
      case WAIT_SYNC:
        if (b == SYNC) state = WAIT_TYPE;
        break;
      case WAIT_TYPE:
        if (b == 0x01) { state = WAIT_DATA; idx = 0; }
        else state = WAIT_SYNC;
        break;
      case WAIT_DATA:
        buffer[idx++] = b;
        if (idx >= sizeof(SensorPacket)) state = WAIT_CKSUM;
        break;
      case WAIT_CKSUM: {
        uint8_t cks = 0;
        for (uint8_t i = 0; i < sizeof(SensorPacket); i++) cks ^= buffer[i];
        if (b == cks) {
          memcpy(&pkt, buffer, sizeof(SensorPacket));
          state = WAIT_SYNC;
          return true;
        }
        state = WAIT_SYNC;
        break;
      }
    }
  }
  return false;
}

bool UARTISR::sendMotorCmd(int16_t left, int16_t right) {
  if (!_serial) return false;
  struct __attribute__((packed)) { int16_t left; int16_t right; } cmd = {left, right};
  uint8_t buf[sizeof(cmd) + 3];
  buf[0] = SYNC;
  buf[1] = 0x02;
  memcpy(&buf[2], &cmd, sizeof(cmd));
  uint8_t cks = 0;
  for (size_t i = 2; i < sizeof(cmd) + 2; i++) cks ^= buf[i];
  buf[sizeof(cmd) + 2] = cks;
  return _serial->write(buf, sizeof(buf)) == sizeof(buf);
}