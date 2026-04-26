#include "dstar_lite.h"
#include <algorithm>

DStarLite::DStarLite(int width, int height) : width_(width), height_(height) {
  grid_.resize(height_, std::vector<Cell>(width_));
}

void DStarLite::setGridSize(int w, int h) {
  width_ = w; height_ = h;
  grid_.resize(h, std::vector<Cell>(w));
}

void DStarLite::setStart(int x, int y) { startX_ = x; startY_ = y; }
void DStarLite::setGoal(int x, int y) { goalX_ = x; goalY_ = y; }

void DStarLite::setObstacle(int x, int y, bool obs) {
  if (x<0||x>=width_||y<0||y>=height_) return;
  if (grid_[y][x].occupied == obs) return;
  grid_[y][x].occupied = obs;
  // update neighbors
  for (int dy=-1; dy<=1; dy++)
    for (int dx=-1; dx<=1; dx++)
      updateVertex(x+dx, y+dy);
}

float DStarLite::heuristic(int x, int y) {
  return sqrtf((x-goalX_)*(x-goalX_) + (y-goalY_)*(y-goalY_));
}

float DStarLite::cost(const Cell &a, const Cell &b) {
  if (a.occupied || b.occupied) return INFINITY;
  return 1.0f;
}

void DStarLite::updateVertex(int x, int y) {
  if (x<0||x>=width_||y<0||y>=height_) return;
  if (x==goalX_ && y==goalY_) return;
  // compute min rhs from neighbors
  float minRhs = INFINITY;
  for (int dy=-1; dy<=1; dy++) {
    for (int dx=-1; dx<=1; dx++) {
      if (dx==0 && dy==0) continue;
      int nx = x+dx, ny = y+dy;
      if (nx<0||nx>=width_||ny<0||ny>=height_) continue;
      minRhs = fminf(minRhs, grid_[ny][nx].g + cost(grid_[y][x], grid_[ny][nx]));
    }
  }
  grid_[y][x].rhs = minRhs;
  // remove from queue
  openList_.erase(std::remove_if(openList_.begin(), openList_.end(),
    [x,y](const QueueEntry &e){ return e.x==x && e.y==y; }), openList_.end());
  if (grid_[y][x].g != grid_[y][x].rhs)
    insertQueue(x, y);
  //sortBased on keys
}

void DStarLite::insertQueue(int x, int y) {
  float k1 = fminf(grid_[y][x].g, grid_[y][x].rhs) + heuristic(x,y);
  float k2 = fminf(grid_[y][x].g, grid_[y][x].rhs);
  openList_.push_back({x, y, k1, k2});
  std::sort(openList_.begin(), openList_.end(), queueCompare);
}

Cell* DStarLite::topQueue() {
  if (openList_.empty()) return nullptr;
  return &grid_[openList_.front().y][openList_.front().x];
}

void DStarLite::popQueue() {
  if (!openList_.empty()) openList_.erase(openList_.begin());
}

bool DStarLite::queueCompare(const QueueEntry &a, const QueueEntry &b) {
  if (a.k1 < b.k1) return true;
  if (a.k1 > b.k1) return false;
  return a.k2 < b.k2;
}

bool DStarLite::computeShortestPath() {
  while (!openList_.empty()) {
    Cell *u = topQueue();
    float u_k1 = openList_.front().k1;
    float u_k2 = openList_.front().k2;
    float start_k1 = fminf(grid_[startY_][startX_].g, grid_[startY_][startX_].rhs) + heuristic(startX_, startY_);
    if (u_k1 > start_k1 && grid_[startY_][startX_].g == grid_[startY_][startX_].rhs)
      return true;
    popQueue();
    if (u->g > u->rhs) {
      u->g = u->rhs;
      for (int dy=-1; dy<=1; dy++)
        for (int dx=-1; dx<=1; dx++)
          updateVertex(u->x+dx, u->y+dy);
    } else {
      u->g = INFINITY;
      updateVertex(u->x, u->y);
      for (int dy=-1; dy<=1; dy++)
        for (int dx=-1; dx<=1; dx++)
          if (dx!=0 || dy!=0) updateVertex(u->x+dx, u->y+dy);
    }
  }
  return false;
}

std::vector<std::pair<int,int>> DStarLite::getPath(int maxSteps) {
  std::vector<std::pair<int,int>> path;
  int x = startX_, y = startY_;
  path.push_back({x,y});
  for (int step=0; step<maxSteps; step++) {
    if (x==goalX_ && y==goalY_) break;
    float best = INFINITY;
    int bx=x, by=y;
    for (int dy=-1; dy<=1; dy++) {
      for (int dx=-1; dx<=1; dx++) {
        if (dx==0 && dy==0) continue;
        int nx=x+dx, ny=y+dy;
        if (nx<0||nx>=width_||ny<0||ny>=height_) continue;
        if (!grid_[ny][nx].occupied && grid_[ny][nx].g < best) {
          best = grid_[ny][nx].g;
          bx=nx; by=ny;
        }
      }
    }
    if (bx==x && by==y) break; // stuck
    path.push_back({bx,by});
    x=bx; y=by;
  }
  return path;
}