#include "uart_comm.h"

void UARTComm::begin(HardwareSerial &serial, uint32_t baud) {
  _serial = &serial;
  _serial->begin(baud);
  _rxState = WAIT_SYNC;
}

bool UARTComm::sendSensorData(const SensorData &data) {
  uint8_t buf[sizeof(SensorData) + 3];
  buf[0] = SYNC;
  buf[1] = 0x01;
  memcpy(&buf[2], &data, sizeof(SensorData));
  uint8_t cks = 0;
  for (size_t i = 2; i < sizeof(SensorData) + 2; i++) cks ^= buf[i];
  buf[sizeof(SensorData) + 2] = cks;
  return _serial->write(buf, sizeof(buf)) == sizeof(buf);
}

bool UARTComm::receiveMotorCmd(MotorCmd &cmd) {
  while (_serial->available()) {
    uint8_t b = _serial->read();
    switch (_rxState) {
      case WAIT_SYNC:
        if (b == SYNC) _rxState = WAIT_CMD;
        break;
      case WAIT_CMD:
        if (b == 0x02) { _rxState = WAIT_DATA; _dataIdx = 0; }
        else _rxState = WAIT_SYNC;
        break;
      case WAIT_DATA:
        _dataBytes[_dataIdx++] = b;
        if (_dataIdx >= sizeof(MotorCmd)) {
          if (_serial->available()) {
            uint8_t cks_rcvd = _serial->read();
            uint8_t cks_calc = 0;
            for (uint8_t i = 0; i < sizeof(MotorCmd); i++) cks_calc ^= _dataBytes[i];
            if (cks_rcvd == cks_calc) {
              memcpy(&cmd, _dataBytes, sizeof(MotorCmd));
              _rxState = WAIT_SYNC;
              return true;
            }
          }
          _rxState = WAIT_SYNC;
        }
        break;
    }
  }
  return false;
}