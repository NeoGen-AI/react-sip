import { ISipReducer, IAction } from 'lib/interfaces';
export declare const defaultState: ISipReducer;
export declare const updateReducer: (payload: any) => IAction;
export declare const SipReducer: (state: any, { type, payload }: IAction) => ISipReducer;
