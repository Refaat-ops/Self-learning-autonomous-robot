#include "vehicle_state.h"

VehicleState::VehicleState() : _pose{0,0,0}, _goal{5,0}, _prevEncL(0), _prevEncR(0) {
  _sensors = {999.0f, 999.0f, 999.0f, 999.0f, 999.0f};
}

void VehicleState::setPose(float x, float y, float theta) { _pose = {x, y, theta}; }
Pose2D VehicleState::getPose() const { return _pose; }
void VehicleState::setGoal(float x, float y) { _goal = {x, y}; }
Pose2D VehicleState::getGoal() const { return _goal; }

void VehicleState::updateFromEncoders(int32_t encL, int32_t encR, float imuYaw, float dt) {
  int32_t dL = encL - _prevEncL;
  int32_t dR = encR - _prevEncR;
  _prevEncL = encL;
  _prevEncR = encR;

  float distL = (dL / pulsesPerRev) * (2.0f * PI * wheelRadius);
  float distR = (dR / pulsesPerRev) * (2.0f * PI * wheelRadius);
  float dCenter = (distR + distL) / 2.0f;

  _pose.theta = imuYaw;
  _pose.x += dCenter * cos(_pose.theta);
  _pose.y += dCenter * sin(_pose.theta);
}

void VehicleState::updateSensors(const Sensors &s) { _sensors = s; }
VehicleState::Sensors VehicleState::getSensors() const { return _sensors; }