#ifndef DSTAR_LITE_H
#define DSTAR_LITE_H
#include <vector>
#include <utility>
#include <cmath>

struct Cell {
  int x, y;
  float g, rhs;
  float k1, k2;
  bool occupied;
  Cell() : g(INFINITY), rhs(INFINITY), occupied(false) {}
};

class DStarLite {
public:
  DStarLite(int width, int height);
  void setGridSize(int w, int h);
  void setStart(int x, int y);
  void setGoal(int x, int y);
  void setObstacle(int x, int y, bool obs);
  bool computeShortestPath();
  std::vector<std::pair<int,int>> getPath(int maxSteps = 200);

private:
  int width_, height_;
  int startX_, startY_, goalX_, goalY_;
  std::vector<std::vector<Cell>> grid_;
  float heuristic(int x, int y);
  float cost(const Cell &a, const Cell &b);
  void updateVertex(int x, int y);
  void insertQueue(int x, int y);
  Cell* topQueue();
  void popQueue();
  struct QueueEntry { int x,y; float k1,k2; };
  std::vector<QueueEntry> openList_;
  static bool queueCompare(const QueueEntry &a, const QueueEntry &b);
};

#endif