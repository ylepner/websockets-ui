export interface AttackRequest {
  type: 'attack';
  data: {
    gameId: number;
    x: number;
    y: number;
    indexPlayer: number /* id of the player in the current game */;
  };
  id: 0;
}

export interface AttackResponse {
  type: 'attack';
  data: {
    position: {
      x: number;
      y: number;
    };
    currentPlayer: number /* id of the player in the current game */;
    status: 'miss' | 'killed' | 'shot';
  };
  id: 0;
}

export interface RandomAttackRequest {
  type: 'randomAttack';
  data: {
    gameId: number;
    indexPlayer: number /* id of the player in the current game */;
  };
  id: 0;
}

export interface Turn {
  type: 'turn';
  data: {
    currentPlayer: number;
  };
  id: 0;
}

export interface Finish {
  type: 'finish';
  data: {
    winPlayer: number;
  };
  id: 0;
}
