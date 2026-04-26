#ifndef VEHICLE_STATE_H
#define VEHICLE_STATE_H
#include <Arduino.h>

struct Pose2D {
  float x, y, theta;  // m, rad
};

class VehicleState {
public:
  VehicleState();
  void setPose(float x, float y, float theta);
  Pose2D getPose() const;
  void setGoal(float x, float y);
  Pose2D getGoal() const;
  void updateFromEncoders(int32_t encL, int32_t encR, float imuYaw, float dt);

  struct Sensors {
    float front, left, right, back;
    float lidar;
  };
  void updateSensors(const Sensors &s);
  Sensors getSensors() const;

private:
  Pose2D _pose, _goal;
  Sensors _sensors;
  int32_t _prevEncL, _prevEncR;
  const float wheelBase = 0.25f;
  const float wheelRadius = 0.035f;
  const float pulsesPerRev = 20.0f;
};

#endif