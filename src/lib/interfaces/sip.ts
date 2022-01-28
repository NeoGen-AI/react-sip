export enum EStatus {
  Disconnected = "sipStatus/DISCONNECTED",
  Connecting = "sipStatus/CONNECTING",
  Connected = "sipStatus/CONNECTED",
  Registered = "sipStatus/REGISTERED",
  Error = "sipStatus/ERROR"
}


export enum EErrorTypes {
  Configuration = "sipErrorType/CONFIGURATION",
  Connection = "sipErrorType/CONNECTION",
  Registration = "sipErrorType/REGISTRATION",
};

export interface IError {
  type: EErrorTypes,
  message: string,
  data?: any;
}

export interface ICall {
  status: ECallStatus,
  direction: ECallDirection,

}

export enum ECallStatus {
  Idle = "callStatus/IDLE",
  Starting = "callStatus/STARTING",
  Active = "callStatus/ACTIVE",
  Stopping = "callStatus/STOPPING",
}

export enum ECallDirection {
  Incoming = "callDirection/INCOMING",
  Outgoing = "callDirection/OUTGOING",
}