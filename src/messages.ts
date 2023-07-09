export interface RegisterRequest {
  type: 'reg';
  data: {
    name: string;
    password: string;
  },
  id: 0,
}



export type InputMessage = RegisterRequest;

export interface RegisterResponse {
  type: "reg",
  data: {
    name: string,
    index: number,
    error: boolean,
    errorText: string,
  },
  id: 0,
}