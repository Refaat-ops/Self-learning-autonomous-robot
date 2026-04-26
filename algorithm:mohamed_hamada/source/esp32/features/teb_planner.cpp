#include "teb_planner.h"
#include <algorithm>

TEBPlanner::TEBPlanner() {}

void TEBPlanner::setObstacleGrid(const std::vector<std::vector<bool>> &grid,
                                  float resolution, float originX, float originY) {
  obsGrid_ = grid;
  res_ = resolution;
  originX_ = originX;
  originY_ = originY;
  hasGrid_ = true;
}

float TEBPlanner::obstacleCost(float x, float y) {
  if (!hasGrid_) return 0.0f;
  int ix = (x - originX_) / res_;
  int iy = (y - originY_) / res_;
  if (ix<0 || ix>= (int)obsGrid_[0].size() || iy<0 || iy>=(int)obsGrid_.size()) return 10.0f;
  return obsGrid_[iy][ix] ? 10.0f : 0.0f;
}

void TEBPlanner::plan(const Pose2D& current, const Pose2D& goal,
                      const std::vector<Pose2D>& globalPath,
                      float &v_cmd, float &omega_cmd) {
  trajectory_.resize(N_);
  Pose2D target = goal;
  if (!globalPath.empty()) target = globalPath.front();
  for (size_t i = 0; i < N_; i++) {
    float alpha = (float)i / (N_-1);
    trajectory_[i].x = current.x + (target.x - current.x) * alpha;
    trajectory_[i].y = current.y + (target.y - current.y) * alpha;
    trajectory_[i].theta = atan2(target.y - current.y, target.x - current.x);
    trajectory_[i].dt = dt_ref_;
  }

  optimize(10);

  const TrajPoint &p0 = trajectory_[0];
  const TrajPoint &p1 = trajectory_[1];
  float dx = p1.x - p0.x;
  float dy = p1.y - p0.y;
  float dtheta = atan2(sin(p1.theta - p0.theta), cos(p1.theta - p0.theta));
  v_cmd = constrain(sqrtf(dx*dx + dy*dy) / p0.dt, -v_max_, v_max_);
  omega_cmd = constrain(dtheta / p0.dt, -omega_max_, omega_max_);
}

void TEBPlanner::optimize(int iterations) {
  for (int iter = 0; iter < iterations; iter++) {
    std::vector<TrajPoint> grad(trajectory_.size(), {0,0,0,0});
    // Smoothness
    for (size_t i = 1; i < trajectory_.size()-1; i++) {
      float dx_prev = trajectory_[i].x - trajectory_[i-1].x;
      float dy_prev = trajectory_[i].y - trajectory_[i-1].y;
      float dx_next = trajectory_[i+1].x - trajectory_[i].x;
      float dy_next = trajectory_[i+1].y - trajectory_[i].y;
      grad[i].x += w_smooth_ * 2*(dx_next - dx_prev)*(-1);
      grad[i].y += w_smooth_ * 2*(dy_next - dy_prev)*(-1);
      grad[i-1].x += w_smooth_ * 2*(dx_next - dx_prev)*1;
      grad[i-1].y += w_smooth_ * 2*(dy_next - dy_prev)*1;
      grad[i+1].x += w_smooth_ * 2*(dx_next - dx_prev)*1;
      grad[i+1].y += w_smooth_ * 2*(dy_next - dy_prev)*1;
    }
    // Obstacle
    for (size_t i = 0; i < trajectory_.size(); i++) {
      const float eps = 0.01f;
      grad[i].x += w_obs_ * (obstacleCost(trajectory_[i].x+eps, trajectory_[i].y) -
                             obstacleCost(trajectory_[i].x-eps, trajectory_[i].y)) / (2*eps);
      grad[i].y += w_obs_ * (obstacleCost(trajectory_[i].x, trajectory_[i].y+eps) -
                             obstacleCost(trajectory_[i].x, trajectory_[i].y-eps)) / (2*eps);
    }
    // Reference
    for (size_t i = 0; i < trajectory_.size(); i++) {
      float dx = trajectory_[i].x - trajectory_.back().x;
      float dy = trajectory_[i].y - trajectory_.back().y;
      grad[i].x += w_ref_ * 2 * dx;
      grad[i].y += w_ref_ * 2 * dy;
    }
    float step = 0.01f;
    for (size_t i = 0; i < trajectory_.size(); i++) {
      trajectory_[i].x -= step * grad[i].x;
      trajectory_[i].y -= step * grad[i].y;
    }
  }
}