#ifndef UART_COMM_H
#define UART_COMM_H
#include <Arduino.h>

struct SensorData {
  uint16_t ultra_front;
  uint16_t ultra_left;
  uint16_t ultra_right;
  uint16_t ultra_back;
  int16_t imu_yaw;        // 0.01 rad
  int32_t enc_left;
  int32_t enc_right;
  uint16_t battery_mv;
} __attribute__((packed));

struct MotorCmd {
  int16_t left_speed;
  int16_t right_speed;
} __attribute__((packed));

class UARTComm {
public:
  void begin(HardwareSerial &serial, uint32_t baud);
  bool sendSensorData(const SensorData &data);
  bool receiveMotorCmd(MotorCmd &cmd);
private:
  HardwareSerial *_serial;
  static const uint8_t SYNC = 0xAA;
  enum RxState { WAIT_SYNC, WAIT_CMD, WAIT_DATA };
  RxState _rxState = WAIT_SYNC;
  uint8_t _dataBytes[sizeof(MotorCmd)];
  uint8_t _dataIdx = 0;
};

#endif