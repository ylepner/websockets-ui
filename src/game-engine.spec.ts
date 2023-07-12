import { expect } from "chai";
import { GameEngine } from "./game-engine"

const messages: any[] = [
  {
    "type": "in",
    "data": {
      "type": "reg",
      "data": { "name": "1111111111111111", "password": "11111111111111" },
      "id": 0
    }
  },
  {
    "type": "out",
    "data": {
      "type": "reg",
      "data": {
        "name": "1111111111111111",
        "index": 0,
        "error": false,
        "errorText": ""
      },
      "id": 0
    },
    "userId": 0
  },
  {
    "type": "in",
    "data": {
      "type": "reg",
      "data": { "name": "2222222222222", "password": "2222222222222222" },
      "id": 0
    }
  },
  {
    "type": "out",
    "data": { "type": "update_room", "id": 0, "data": [] },
    "userId": 0
  },
  {
    "type": "out",
    "data": {
      "type": "reg",
      "data": {
        "name": "2222222222222",
        "index": 1,
        "error": false,
        "errorText": ""
      },
      "id": 0
    },
    "userId": 1
  },
  { "type": "in", "data": { "type": "create_room", "data": "", "id": 0 } },
  {
    "type": "out",
    "data": {
      "type": "update_room",
      "id": 0,
      "data": [
        { "roomId": 0, "roomUsers": [{ "index": 1, "name": "2222222222222" }] }
      ]
    },
    "userId": 0
  },
  {
    "type": "out",
    "data": {
      "type": "update_room",
      "id": 0,
      "data": [
        { "roomId": 0, "roomUsers": [{ "index": 1, "name": "2222222222222" }] }
      ]
    },
    "userId": 1
  },
  { "type": "in", "data": { "type": "create_room", "data": "", "id": 0 } },
  {
    "type": "out",
    "data": {
      "type": "update_room",
      "id": 0,
      "data": [
        { "roomId": 0, "roomUsers": [{ "index": 1, "name": "2222222222222" }] },
        {
          "roomId": 1,
          "roomUsers": [{ "index": 0, "name": "1111111111111111" }]
        }
      ]
    },
    "userId": 0
  },
  {
    "type": "out",
    "data": {
      "type": "update_room",
      "id": 0,
      "data": [
        { "roomId": 0, "roomUsers": [{ "index": 1, "name": "2222222222222" }] },
        {
          "roomId": 1,
          "roomUsers": [{ "index": 0, "name": "1111111111111111" }]
        }
      ]
    },
    "userId": 1
  }
]



describe('Game engine', () => {
  it('should register 2 players', () => {
    const gameEngine = new GameEngine();
    let afterResponse: any
    const user1Reg = gameEngine.regUser(messages[0].data, (reponse) => {
      afterResponse = reponse;
    })
    expect(afterResponse).to.be.deep.eq(messages[1].data);
    let userRegResponse: any;
    const user2Reg = gameEngine.regUser(messages[2].data, (response) => {
      userRegResponse = response;
    })

    console.log(afterResponse)
  })
})