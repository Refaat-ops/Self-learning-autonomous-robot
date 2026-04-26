#include <Arduino.h>
#include "hal/motor.h"
#include "app/sensor_manager.h"
#include "com/uart_comm.h"

// تعريف المحركات الأربعة حسب صورتك
// أمامي: ENA=2, ENB=3; IN1=22, IN2=23, IN3=24, IN4=25
Motor motorFL(2, 22, 23);   // Front-Left
Motor motorFR(3, 24, 25);   // Front-Right
// خلفي: ENA=4, ENB=5; IN1=26, IN2=27, IN3=28, IN4=29
Motor motorRL(4, 26, 27);   // Rear-Left
Motor motorRR(5, 28, 29);   // Rear-Right

SensorManager sensors;
UARTComm comm;

void setup() {
  sensors.begin();
  motorFL.begin();
  motorFR.begin();
  motorRL.begin();
  motorRR.begin();
  
  // استخدام Serial3 للتواصل مع ESP32 (14,15)
  comm.begin(Serial3, 115200);
  
  // Buzzer و RGB LEDs اختيارية
  pinMode(40, OUTPUT);
  pinMode(41, OUTPUT);
  pinMode(42, OUTPUT);
  pinMode(43, OUTPUT);
}

void loop() {
  sensors.update();
  SensorData data = sensors.getData();
  comm.sendSensorData(data);

  MotorCmd cmd;
  if (comm.receiveMotorCmd(cmd)) {
    // توجيه الأوامر: جميع المحركات اليسرى تأخذ left_speed، اليمنى right_speed
    motorFL.setSpeed(cmd.left_speed);
    motorRL.setSpeed(cmd.left_speed);
    motorFR.setSpeed(cmd.right_speed);
    motorRR.setSpeed(cmd.right_speed);
  }

  // تحديث RGB حسب حالة ما (مثال)
  // ...

  delay(10);
}