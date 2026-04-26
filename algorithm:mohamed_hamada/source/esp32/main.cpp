#include <Arduino.h>
#include "com/uart_isr.h"
#include "app/vehicle_state.h"
#include "app/path_planner.h"

VehicleState vehicle;
PathPlanner planner(vehicle);

void sensorTask(void *pv) {
  SensorPacket pkt;
  for (;;) {
    if (UARTISR::getSensorData(pkt, pdMS_TO_TICKS(50))) {
      VehicleState::Sensors s;
      s.front = pkt.ultra_front / 1000.0f;
      s.left  = pkt.ultra_left / 1000.0f;
      s.right = pkt.ultra_right / 1000.0f;
      s.back  = pkt.ultra_back / 1000.0f;
      s.lidar = 99.0f; // سيتم تحديثه داخل البلانر
      vehicle.updateFromEncoders(pkt.enc_left, pkt.enc_right, pkt.imu_yaw * 0.01f, 0.1f);
      vehicle.updateSensors(s);
    }
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

void plannerTask(void *pv) {
  for (;;) {
    planner.update();
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void setup() {
  Serial.begin(115200);
  UARTISR::begin(Serial1, 115200, 3, 1); // ESP32 RX1=3, TX1=1 to Mega Serial3
  vehicle.setPose(0, 0, 0);
  vehicle.setGoal(4.0f, 0.0f);
  planner.begin();

  xTaskCreate(sensorTask, "sensor", 4096, NULL, 2, NULL);
  xTaskCreate(plannerTask, "planner", 8192, NULL, 3, NULL);
}

void loop() { vTaskDelete(NULL); }