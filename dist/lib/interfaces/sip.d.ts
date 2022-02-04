export declare enum EStatus {
    Disconnected = "sipStatus/DISCONNECTED",
    Connecting = "sipStatus/CONNECTING",
    Connected = "sipStatus/CONNECTED",
    Registered = "sipStatus/REGISTERED",
    Error = "sipStatus/ERROR"
}
export declare enum EErrorTypes {
    Configuration = "sipErrorType/CONFIGURATION",
    Connection = "sipErrorType/CONNECTION",
    Registration = "sipErrorType/REGISTRATION"
}
export interface IError {
    type: EErrorTypes;
    message: string;
    data?: any;
}
export interface ICall {
    status: ECallStatus;
    direction: ECallDirection;
}
export declare enum ECallStatus {
    Idle = "callStatus/IDLE",
    Starting = "callStatus/STARTING",
    Active = "callStatus/ACTIVE",
    Stopping = "callStatus/STOPPING"
}
export declare enum ECallDirection {
    Incoming = "callDirection/INCOMING",
    Outgoing = "callDirection/OUTGOING"
}
