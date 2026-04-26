#ifndef Q_LEARNING_H
#define Q_LEARNING_H
#include <Arduino.h>
#include <vector>

class QLearning {
public:
  QLearning();
  void begin();
  int chooseAction(int state);        // epsilon-greedy
  void learn(int state, int action, float reward, int nextState);
  void setEpsilon(float eps) { epsilon_ = eps; }
  // discretize sensor readings to state index
  int getState(float front, float left, float right, float goalAngle);

  // action space: 0=forward, 1=turn left, 2=turn right, 3=slight left, 4=slight right
  enum Action { FORWARD=0, TURN_LEFT, TURN_RIGHT, SLIGHT_LEFT, SLIGHT_RIGHT };
  void actionToCommand(int action, float &v, float &omega);

private:
  const int numStates_ = 81; // e.g., 3 dist bins ^4 (81 states)
  const int numActions_ = 5;
  std::vector<std::vector<float>> Q_; // [state][action]
  float epsilon_ = 0.3f;
  float alpha_ = 0.1f;
  float gamma_ = 0.9f;
};

#endif