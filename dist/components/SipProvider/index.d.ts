import * as PropTypes from "prop-types";
import * as React from "react";
import { CallDirection, CallStatus, SipErrorType, SipStatus } from "../../lib/enums";
import { ExtraHeaders, IceServers } from "../../lib/types";
export default class SipProvider extends React.Component<{
    host: string;
    port: number;
    pathname: string;
    user: string;
    password: string;
    autoRegister: boolean;
    autoAnswer: boolean;
    iceRestart: boolean;
    sessionTimersExpires: number;
    extraHeaders: ExtraHeaders;
    iceServers: IceServers;
    debug: boolean;
}, {
    sipStatus: SipStatus;
    sipErrorType: SipErrorType | null;
    sipErrorMessage: string | null;
    callStatus: CallStatus;
    callDirection: CallDirection | null;
    callCounterpart: string | null;
    rtcSession: any;
}> {
    static childContextTypes: {
        sip: PropTypes.Requireable<PropTypes.InferProps<{
            status: PropTypes.Requireable<string>;
            errorType: PropTypes.Requireable<string>;
            errorMessage: PropTypes.Requireable<string>;
            host: PropTypes.Requireable<string>;
            port: PropTypes.Requireable<number>;
            user: PropTypes.Requireable<string>;
            password: PropTypes.Requireable<string>;
            autoRegister: PropTypes.Requireable<boolean>;
            autoAnswer: PropTypes.Requireable<boolean>;
            sessionTimersExpires: PropTypes.Requireable<number>;
            extraHeaders: PropTypes.Requireable<{
                [x: string]: (string | null | undefined)[] | null | undefined;
            }>;
            iceServers: PropTypes.Requireable<(object | null | undefined)[]>;
            debug: PropTypes.Requireable<boolean>;
        }>>;
        call: PropTypes.Requireable<PropTypes.InferProps<{
            id: PropTypes.Requireable<string>;
            status: PropTypes.Requireable<string>;
            direction: PropTypes.Requireable<string>;
            counterpart: PropTypes.Requireable<string>;
        }>>;
        registerSip: PropTypes.Requireable<(...args: any[]) => any>;
        unregisterSip: PropTypes.Requireable<(...args: any[]) => any>;
        answerCall: PropTypes.Requireable<(...args: any[]) => any>;
        startCall: PropTypes.Requireable<(...args: any[]) => any>;
        stopCall: PropTypes.Requireable<(...args: any[]) => any>;
    };
    static propTypes: {
        host: PropTypes.Requireable<string>;
        port: PropTypes.Requireable<number>;
        pathname: PropTypes.Requireable<string>;
        user: PropTypes.Requireable<string>;
        password: PropTypes.Requireable<string>;
        autoRegister: PropTypes.Requireable<boolean>;
        autoAnswer: PropTypes.Requireable<boolean>;
        iceRestart: PropTypes.Requireable<boolean>;
        sessionTimersExpires: PropTypes.Requireable<number>;
        extraHeaders: PropTypes.Requireable<{
            [x: string]: (string | null | undefined)[] | null | undefined;
        }>;
        iceServers: PropTypes.Requireable<(object | null | undefined)[]>;
        debug: PropTypes.Requireable<boolean>;
        children: PropTypes.Requireable<PropTypes.ReactNodeLike>;
    };
    static defaultProps: {
        host: null;
        port: null;
        pathname: string;
        user: null;
        password: null;
        autoRegister: boolean;
        autoAnswer: boolean;
        iceRestart: boolean;
        sessionTimersExpires: number;
        extraHeaders: {
            register: never[];
            invite: never[];
        };
        iceServers: never[];
        debug: boolean;
        children: null;
    };
    private ua;
    private remoteAudio;
    private logger;
    constructor(props: any);
    getChildContext(): {
        sip: {
            status: SipStatus;
            errorType: SipErrorType | null;
            errorMessage: string | null;
            host: string;
            port: number;
            pathname: string;
            user: string;
            password: string;
            autoRegister: boolean;
            autoAnswer: boolean;
            iceRestart: boolean;
            sessionTimersExpires: number;
            extraHeaders: ExtraHeaders;
            iceServers: IceServers;
            debug: boolean;
            children?: React.ReactNode;
        };
        call: {
            id: string;
            status: CallStatus;
            direction: CallDirection | null;
            counterpart: string | null;
        };
        registerSip: () => any;
        unregisterSip: () => any;
        answerCall: () => void;
        startCall: (destination: any) => void;
        stopCall: () => void;
    };
    componentDidMount(): void;
    componentDidUpdate(prevProps: any): void;
    componentWillUnmount(): void;
    registerSip: () => any;
    unregisterSip: () => any;
    answerCall: () => void;
    startCall: (destination: any) => void;
    stopCall: () => void;
    reconfigureDebug(): void;
    reinitializeJsSIP(): void;
    render(): React.ReactNode;
}
