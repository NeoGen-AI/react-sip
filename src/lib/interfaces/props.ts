export interface IProps {
  config: IConfig;
  options: IOptions;
}

type IConfig = { 
  host: string;
  port: number;
  username: string;
  pathname?: string;
  password?: string;
}

type IOptions = {
  autoRegister?: boolean;
  autoAnswer?: boolean;
  iceRestart?: boolean;
  sessionTimersExpires?: number;
  debug?: boolean;
  extraHeaders?: ExtraHeaders;
  iceServers?: any;
}

export type IReturnValues = {
  sip: any;
  registerSip: any;
  unregisterSip: any;
  answerCall: any;
  startCall: any;
  stopCall: any;
}

export interface ExtraHeaders {
  register?: string[];
  invite?: string[];
}