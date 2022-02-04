export interface IProps {
    config: IConfig;
    options: IOptions;
    children: any;
}
declare type IConfig = {
    host: string;
    port: number;
    pathname: string;
    user: string;
    password: string;
};
declare type IOptions = {
    autoRegister?: boolean;
    autoAnswer?: boolean;
    iceRestart?: boolean;
    sessionTimersExpires?: number;
    debug?: boolean;
    extraHeaders?: ExtraHeaders;
};
export interface ExtraHeaders {
    register?: string[];
    invite?: string[];
}
export {};
