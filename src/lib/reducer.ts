import { ISip } from 'lib/interfaces'

export type SipState = {
  status: ISip.EStatus;
  error: ISip.IError | null;
  callStatus: ISip.ECallStatus;
  callDirection: ISip.ECallDirection | null;
  callCounterpart: string | null;
}

export const defaultState: SipState = {
  status: ISip.EStatus.Disconnected,
  error: null,
  callStatus: ISip.ECallStatus.Idle,
  callDirection: null,
  callCounterpart: null,
}

export enum EActionTypes {
  UpdateState = 'UPDATE_STATE',
}

export type IAction = {
  type: EActionTypes,
  payload?: any;
}

export const updateReducer = (payload): IAction => ({
  type: EActionTypes.UpdateState,
  payload
})

export const SipReducer = (
  state,
  { type, payload = {} }: IAction
): SipState => {
  switch(type) {
    case EActionTypes.UpdateState:
        return {
          ...state,
          ...payload
        }
    default:
    return state;
  }
}