import { ISip, ISipReducer, EActionTypes, IAction } from '../lib/interfaces'

export const defaultState: ISipReducer = {
  status: ISip.EStatus.Disconnected,
  error: null,
  callStatus: ISip.ECallStatus.Idle,
  callDirection: null,
  callCounterpart: null,
}



export const updateReducer = (payload): IAction => ({
  type: EActionTypes.UpdateState,
  payload
})

export const SipReducer = (
  state,
  { type, payload = {} }: IAction
): ISipReducer => {
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