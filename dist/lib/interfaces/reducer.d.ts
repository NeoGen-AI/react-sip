import * as ISip from './sip';
export interface ISipReducer {
    status: ISip.EStatus;
    error: ISip.IError | null;
    callStatus: ISip.ECallStatus;
    callDirection: ISip.ECallDirection | null;
    callCounterpart: string | null;
}
export declare enum EActionTypes {
    UpdateState = "UPDATE_STATE"
}
export declare type IAction = {
    type: EActionTypes;
    payload?: any;
};
