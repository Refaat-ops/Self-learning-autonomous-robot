#include <Wire.h>
#include <MPU6050.h>

MPU6050 mpu;

// Pins
#define LED 13

#define ENA 5
#define ENB 6
#define IN1 7
#define IN2 8
#define IN3 9
#define IN4 10

void moveForward() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  analogWrite(ENA, 150);
  analogWrite(ENB, 150);
}

void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void adjustDirection() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  analogWrite(ENA, 150);
  analogWrite(ENB, 150);
}

void setup() {
  Serial.begin(9600);

  Wire.begin();
  mpu.initialize();

  pinMode(LED, OUTPUT);

  pinMode(ENA, OUTPUT);
  pinMode(ENB, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  Serial.println("System Ready");
}

void loop() {

  int16_t gx, gy, gz;
  mpu.getRotation(&gx, &gy, &gz);

  // Debug
  Serial.print("gz = ");
  Serial.println(gz);

  // شرط الانحراف (حسب Wokwi range)
  if (abs(gz) > 30) {
    digitalWrite(LED, HIGH);

    stopMotors();
    delay(200);

    adjustDirection();
  } 
  else {
    digitalWrite(LED, LOW);
    moveForward();
  }

  delay(100);
}

