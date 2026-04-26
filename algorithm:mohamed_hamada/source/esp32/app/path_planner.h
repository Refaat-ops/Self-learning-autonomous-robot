#ifndef PATH_PLANNER_H
#define PATH_PLANNER_H
#include "../features/dstar_lite.h"
#include "../features/teb_planner.h"
#include "../features/q_learning.h"
#include "vehicle_state.h"
#include "../com/uart_isr.h"
#include "../hal/lidar_serial.h"

class PathPlanner {
public:
  PathPlanner(VehicleState &state);
  void begin();
  void update();

private:
  VehicleState &state_;
  DStarLite dstar_;
  TEBPlanner teb_;
  QLearning qlearn_;
  LidarSerial lidar_;
  static const int MAP_W = 100, MAP_H = 100;
  float map_res_ = 0.1f;
  std::vector<std::vector<bool>> grid_;
  std::vector<std::pair<int,int>> currentPath_;
  void updateGridMap();
  unsigned long last_planner_time_ = 0;
  float world2gridX(float wx) { return wx / map_res_; }
  float world2gridY(float wy) { return wy / map_res_; }
};

#endif