#include "q_learning.h"
#include <cmath>

QLearning::QLearning() {}

void QLearning::begin() {
  Q_.resize(numStates_, std::vector<float>(numActions_, 0.0f));
}

int QLearning::getState(float front, float left, float right, float goalAngle) {
  // discretize distances: near(<0.3m)=0, medium(0.3-1.0m)=1, far(>1.0m)=2
  auto bin = [](float d) { return d<0.3 ? 0 : (d<1.0 ? 1 : 2); };
  int fb = bin(front);
  int lb = bin(left);
  int rb = bin(right);
  // goal angle: -PI..PI, bin to 3: left(-1), front(0), right(1)
  int gb = (goalAngle < -0.5) ? 0 : (goalAngle > 0.5 ? 2 : 1);
  // combine: 3*3*3*3 = 81 states
  return fb*27 + lb*9 + rb*3 + gb;
}

int QLearning::chooseAction(int state) {
  if ((float)rand()/RAND_MAX < epsilon_) {
    return rand() % numActions_;
  } else {
    return std::max_element(Q_[state].begin(), Q_[state].end()) - Q_[state].begin();
  }
}

void QLearning::learn(int state, int action, float reward, int nextState) {
  float maxNext = *std::max_element(Q_[nextState].begin(), Q_[nextState].end());
  Q_[state][action] += alpha_ * (reward + gamma_ * maxNext - Q_[state][action]);
}

void QLearning::actionToCommand(int action, float &v, float &omega) {
  switch (action) {
    case FORWARD: v=0.2f; omega=0.0f; break;
    case TURN_LEFT: v=0.1f; omega=0.8f; break;
    case TURN_RIGHT: v=0.1f; omega=-0.8f; break;
    case SLIGHT_LEFT: v=0.15f; omega=0.4f; break;
    case SLIGHT_RIGHT: v=0.15f; omega=-0.4f; break;
  }
}