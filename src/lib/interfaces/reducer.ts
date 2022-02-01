import * as ISip from './sip';

export interface ISipReducer {
  status: ISip.EStatus;
  error: ISip.IError | null;
  callStatus: ISip.ECallStatus;
  callDirection: ISip.ECallDirection | null;
  callCounterpart: string | null;
}

export enum EActionTypes {
  UpdateState = 'UPDATE_STATE',
}
export type IAction = {
  type: EActionTypes,
  payload?: any;
}