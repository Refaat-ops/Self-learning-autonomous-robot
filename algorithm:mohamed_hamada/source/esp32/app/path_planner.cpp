#include "path_planner.h"

PathPlanner::PathPlanner(VehicleState &state)
    : state_(state), dstar_(MAP_W, MAP_H), grid_(MAP_H, std::vector<bool>(MAP_W, false)) {}

void PathPlanner::begin() {
  lidar_.begin(Serial2, 115200, 16, 17);
  dstar_.setGoal(MAP_W/2 + 40, MAP_H/2);
  srand(1000);
  qlearn_.begin();
}

void PathPlanner::update() {
  unsigned long now = millis();
  if (now - last_planner_time_ < 100) return;
  last_planner_time_ = now;

  Pose2D pose = state_.getPose();
  int gx = world2gridX(pose.x + 4.0f), gy = world2gridY(pose.y);
  dstar_.setGoal(gx, gy);
  int sx = world2gridX(pose.x), sy = world2gridY(pose.y);
  dstar_.setStart(sx, sy);

  updateGridMap();

  for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++)
      dstar_.setObstacle(x, y, grid_[y][x]);

  bool found = dstar_.computeShortestPath();
  if (found) {
    currentPath_ = dstar_.getPath(200);
  }

  std::vector<Pose2D> globalPath;
  for (auto &p : currentPath_) {
    globalPath.push_back({p.first * map_res_, p.second * map_res_, 0});
  }

  Pose2D goal = state_.getGoal();
  float v_cmd = 0, omega_cmd = 0;
  teb_.setObstacleGrid(grid_, map_res_, 0, 0);
  teb_.plan(pose, goal, globalPath, v_cmd, omega_cmd);

  VehicleState::Sensors sens = state_.getSensors();
  float goalAngle = atan2(goal.y - pose.y, goal.x - pose.x) - pose.theta;
  int qState = qlearn_.getState(sens.front, sens.left, sens.right, goalAngle);
  int qAction = qlearn_.chooseAction(qState);
  float q_v, q_omega;
  qlearn_.actionToCommand(qAction, q_v, q_omega);

  v_cmd = 0.8f * v_cmd + 0.2f * q_v;
  omega_cmd = 0.8f * omega_cmd + 0.2f * q_omega;

  static int lastState = 0, lastAction = 0;
  float reward = 0;
  if (sens.front < 0.2f || sens.left < 0.15f || sens.right < 0.15f)
    reward = -10.0f;
  else
    reward = 0.1f;
  static float prevDistToGoal = 0;
  float distToGoal = hypot(goal.x - pose.x, goal.y - pose.y);
  reward += (prevDistToGoal - distToGoal) * 5.0f;
  prevDistToGoal = distToGoal;
  qlearn_.learn(lastState, lastAction, reward, qState);
  lastState = qState;
  lastAction = qAction;

  float L = 0.25f;
  float v_l = v_cmd - omega_cmd * L / 2;
  float v_r = v_cmd + omega_cmd * L / 2;
  auto toPWM = [](float v) { return constrain((int16_t)(v * 800), -255, 255); };
  UARTISR::sendMotorCmd(toPWM(v_l), toPWM(v_r));
}

void PathPlanner::updateGridMap() {
  // مسح الخريطة (باستثناء الحدود)
  for (int y = 1; y < MAP_H - 1; y++)
    std::fill(grid_[y].begin() + 1, grid_[y].end() - 1, false);

  VehicleState::Sensors s = state_.getSensors();
  Pose2D pose = state_.getPose();

  // دالة مساعدة لتعليم عائق في الخريطة بناءً على مسافة وزاوية
  auto markObstacle = [&](float dist_m, float angle_offset) {
    if (dist_m < 2.5f && dist_m > 0.01f) {
      float ox = pose.x + dist_m * cos(pose.theta + angle_offset);
      float oy = pose.y + dist_m * sin(pose.theta + angle_offset);
      int gx = world2gridX(ox), gy = world2gridY(oy);
      if (gx >= 0 && gx < MAP_W && gy >= 0 && gy < MAP_H) {
        // تعليم 3x3 حول النقطة
        for (int dy = -1; dy <= 1; dy++)
          for (int dx = -1; dx <= 1; dx++)
            if (gx + dx >= 0 && gx + dx < MAP_W && gy + dy >= 0 && gy + dy < MAP_H)
              grid_[gy + dy][gx + dx] = true;
      }
    }
  };

  // قراءة LiDAR (أمامي)
  float lidarDist = 99.0f;
  lidar_.readDistance(lidarDist);
  if (lidarDist < 99.0f) markObstacle(lidarDist, 0);

  // العوائق من الألتراسونيك
  markObstacle(s.front, 0);
  markObstacle(s.left, M_PI / 2);
  markObstacle(s.right, -M_PI / 2);
  markObstacle(s.back, M_PI);
}