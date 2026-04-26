#ifndef UART_ISR_H
#define UART_ISR_H
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>

struct SensorPacket {
  uint16_t ultra_front;
  uint16_t ultra_left;
  uint16_t ultra_right;
  uint16_t ultra_back;
  int16_t imu_yaw;
  int32_t enc_left;
  int32_t enc_right;
  uint16_t battery_mv;
};

class UARTISR {
public:
  static void begin(HardwareSerial &serial, int baud, int8_t rxPin, int8_t txPin);
  static bool getSensorData(SensorPacket &pkt, TickType_t timeout = portMAX_DELAY);
  static bool sendMotorCmd(int16_t left, int16_t right);
private:
  static HardwareSerial *_serial;
  static QueueHandle_t _rxQueue;
  static void IRAM_ATTR uartISR();
  static const uint8_t SYNC = 0xAA;
};

#endif