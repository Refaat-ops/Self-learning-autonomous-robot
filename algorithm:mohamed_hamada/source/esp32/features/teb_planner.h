#ifndef TEB_PLANNER_H
#define TEB_PLANNER_H
#include <vector>
#include <cmath>
#include "../app/vehicle_state.h"

class TEBPlanner {
public:
  TEBPlanner();
  // optimize a trajectory from current pose towards a target waypoint, avoiding obstacles
  void plan(const Pose2D& current, const Pose2D& goal,
            const std::vector<Pose2D>& globalPath,
            float &v_cmd, float &omega_cmd);
  void setObstacleGrid(const std::vector<std::vector<bool>> &grid, float resolution, float originX, float originY);

private:
  struct TrajPoint { float x,y,theta; float dt; };
  std::vector<TrajPoint> trajectory_;
  size_t N_ = 5; // points
  float dt_ref_ = 0.1f;
  float v_max_ = 0.3f, omega_max_ = 1.0f;
  // cost weights
  float w_obs_ = 5.0f, w_smooth_ = 1.0f, w_ref_ = 10.0f;
  // obstacle grid
  std::vector<std::vector<bool>> obsGrid_;
  float res_ = 0.05f;
  float originX_ = 0, originY_ = 0;
  bool hasGrid_ = false;

  float obstacleCost(float x, float y);
  void optimize(int iterations = 10);
};

#endif