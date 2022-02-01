export interface IProps {
  config: IConfig;
  options: IOptions;
  children: any;
}

type IConfig = { 
  host: string;
  port: number;
  pathname: string;
  user: string;
  password: string;
}

type IOptions = {
  autoRegister?: boolean;
  autoAnswer?: boolean;
  iceRestart?: boolean;
  sessionTimersExpires?: number;
  debug?: boolean;
  extraHeaders?: ExtraHeaders;
  // iceServers: IceServers;
}

export interface ExtraHeaders {
  register?: string[];
  invite?: string[];
}