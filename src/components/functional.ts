import * as React from 'react';
import * as JsSIP from 'jssip';

import sipLogger from '../lib/logger';
import { ISip, IProps } from '../lib/interfaces';
import { defaultState, SipReducer, updateReducer } from './reducer';

const SipProvider = ({
  config,
  options: {
    autoRegister,
    autoAnswer,
    extraHeaders,
    debug,
    iceServers,
    sessionTimersExpires,
    iceRestart
  },
}: IProps) => {
  const [userAgent, setUserAgent] = React.useState<null | any>(null);
  const [
    activeRtcSession,
    setActiveRtcSession
  ] = React.useState<null | any>(null);
  const [logger, setLogger] = React.useState<any | null>(sipLogger);
  const [sipState, dispatch] = React.useReducer(SipReducer, defaultState);
  const remoteAudio = React.useRef<any>(null);
  const { host, port, username, password, pathname = '' } = config;
  console.log(sipState);
  React.useEffect(() => {
    mountAudioElement();
  }, []);

  React.useEffect(() => {
    initializeJsSIP();
  }, Object.values(config));

  React.useEffect(() => {
    configureDebug();
  }, [debug]);

  const mountAudioElement = () => {
    if (window.document.getElementById('sip-provider-audio')) {
      throw new Error(
        'Creating two SipProviders in one application is forbidden. If that\'s not the case ' +
        'then check if you\'re using "sip-provider-audio" as id attribute for any existing ' +
        'element',
      );
    }
    remoteAudio.current = window.document.createElement('audio');
    remoteAudio.current.id = 'sip-provider-audio';
    window.document.body.appendChild(remoteAudio.current);
  };

  const configureDebug = () => {
    if (debug) {
      JsSIP.debug.enable('JsSIP:*');
      setLogger(console);
    } else {
      JsSIP.debug.disable();
      setLogger(sipLogger);
    }
  };

  const setSipStatus = (
    status: ISip.EStatus,
    error?: ISip.IError
  ) => {
    if (error) {
      logger.error(error.message, error.data);
    }
    dispatch(updateReducer({ status, error }));

  };

  const setCallStatus = (
    status: ISip.ECallStatus,
    direction?: ISip.ECallDirection | null,
    counterpart?: string | null
  ) => {

    dispatch(updateReducer({
      callStatus: status,
      callDirection: direction,
      callCounterpart: counterpart
    }));
  };

  const registerSip = () => {
    if (autoRegister) {
      throw new Error(
        'Calling registerSip is not allowed when autoRegister === true',
      );
    }
    if (sipState.status !== ISip.EStatus.Connected) {
      throw new Error(
        `Calling registerSip is not allowed when sip status is ${sipState.status
        } (expected ${ISip.EStatus.Connected})`,
      );
    }
    return userAgent.register();
  };

  const unregisterSip = () => {
    if (autoRegister) {
      throw new Error(
        'Calling registerSip is not allowed when autoRegister === true',
      );
    }
    if (sipState.status !== ISip.EStatus.Registered) {
      throw new Error(
        `Calling unregisterSip is not allowed when sip status is ${sipState.status
        } (expected ${ISip.EStatus.Registered})`,
      );
    }
    return userAgent.unregister();
  };

  const startCall = (destination) => {
    if (!destination) {
      throw new Error(`Destination must be defined (${destination} given)`);
    }
    if (
      sipState.status !== ISip.EStatus.Connected &&
      sipState.status !== ISip.EStatus.Registered
    ) {
      throw new Error(
        `Calling startCall() is not allowed when sip status is ${sipState.status
        } (expected ${ISip.EStatus.Connected} or ${ISip.EStatus.Registered})`,
      );
    }

    if (sipState.callStatus !== ISip.ECallStatus.Idle) {
      throw new Error(
        `Calling startCall() is not allowed when call status is ${sipState.callStatus
        } (expected ${ISip.ECallStatus.Idle})`,
      );
    }

    const options = {
      extraHeaders: extraHeaders?.invite,
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { iceRestart },
      pcConfig: {
        iceServers,
      },
      sessionTimersExpires,
    };

    userAgent.call(destination, options);
    setCallStatus(ISip.ECallStatus.Starting);
  };

  const stopCall = () => {
    setCallStatus(ISip.ECallStatus.Stopping);
    userAgent.terminateSessions();
  };

  const answerCall = () => {
    if (
      sipState.callStatus !== ISip.ECallStatus.Starting ||
      sipState.callDirection !== ISip.ECallDirection.Incoming
    ) {
      throw new Error(
        `Calling answerCall() is not allowed when call status is ${sipState.callStatus
        } and call direction is ${sipState.callDirection
        }  (expected ${ISip.ECallStatus.Starting} and ${ISip.ECallDirection.Incoming})`,
      );
    }

    activeRtcSession.answer({
      mediaConstraints: {
        audio: true,
        video: false,
      },
      pcConfig: {
        iceServers,
      },
    });
  };


  const initializeJsSIP = () => {
    if (userAgent) {
      userAgent.stop();
      setUserAgent(null);
      return;
    }

    if (!host || !port || !username) {
      setSipStatus(ISip.EStatus.Disconnected);
      return;
    }
    let ua;

    try {
      const socket = new JsSIP.WebSocketInterface(
        `ws://${host}:${port}${pathname}`,
      );
      ua = new JsSIP.UA({
        uri: `sip:${username}@${host}`,
        password,
        sockets: [socket],
        register: autoRegister,
      });
      setUserAgent(ua);
    } catch (error) {
      setSipStatus(ISip.EStatus.Error, {
        type: ISip.EErrorTypes.Configuration,
        message: error.message,
        data: error
      });
      return;
    }

    ua.on('connecting', () => {
      logger.debug('UA "connecting" event');
      setSipStatus(ISip.EStatus.Connecting);
    });

    ua.on('connected', () => {
      logger.debug('UA "connected" event');
      setSipStatus(ISip.EStatus.Connected);
    });

    ua.on('disconnected', (event) => {
      if (event.error) {
        setSipStatus(ISip.EStatus.Error,
          {
            type: ISip.EErrorTypes.Connection,
            message: 'disconnected',
            data: event
          }
        );
      } else {
        logger.debug('UA "disconnected" event', event);
        setSipStatus(ISip.EStatus.Disconnected,
          {
            type: ISip.EErrorTypes.Connection,
            message: 'disconnected'
          }
        );
      }
    });

    ua.on('registered', (data) => {
      logger.debug('UA "registered" event', data);
      setSipStatus(ISip.EStatus.Registered);
      setCallStatus(ISip.ECallStatus.Idle);
    });

    ua.on('unregistered', () => {
      logger.debug('UA "unregistered" event');
      if (ua.isConnected()) {
        setSipStatus(ISip.EStatus.Connected);
        setCallStatus(ISip.ECallStatus.Idle, null);
      } else {
        setSipStatus(ISip.EStatus.Disconnected);
        setCallStatus(ISip.ECallStatus.Idle, null);
      }
    });

    ua.on('registrationFailed', (data) => {
      logger.debug('UA "registrationFailed" event');
      setSipStatus(ISip.EStatus.Error, {
        type: ISip.EErrorTypes.Registration,
        message: data
      });
    });

    ua.on(
      'newRTCSession',
      ({ originator, session: newRtcSession, request: rtcRequest }) => {
        // if (!this || this.ua !== ua) {
        //   return;
        // }

        // identify call direction
        if (originator === 'local') {
          const foundUri = rtcRequest.to.toString();
          const delimiterPosition = foundUri.indexOf(';') || null;
          setCallStatus(
            ISip.ECallStatus.Starting,
            ISip.ECallDirection.Outgoing,
            foundUri.substring(0, delimiterPosition) || foundUri
          );
        } else if (originator === 'remote') {
          const foundUri = rtcRequest.from.toString();
          const delimiterPosition = foundUri.indexOf(';') || null;
          setCallStatus(
            ISip.ECallStatus.Starting,
            ISip.ECallDirection.Incoming,
            foundUri.substring(0, delimiterPosition) || foundUri
          );
        }

        // Avoid if busy or other incoming
        if (activeRtcSession) {
          logger.debug('incoming call replied with 486 "Busy Here"');
          newRtcSession.terminate({
            status_code: 486,
            reason_phrase: 'Busy Here',
          });
          return;
        }

        setActiveRtcSession(newRtcSession);

        newRtcSession.on('failed', () => {
          setActiveRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null);

        });

        newRtcSession.on('ended', () => {
          setActiveRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null);

        });

        newRtcSession.on('accepted', () => {
          [
            remoteAudio.current.srcObject,
          ] = newRtcSession.connection.getRemoteStreams();
          const played = remoteAudio.current.play();

          if (typeof played !== 'undefined') {
            played
              .catch(() => {
                /**/
              })
              .then(() => {
                setTimeout(() => {
                  remoteAudio.current.play();
                }, 2000);
              });
            setCallStatus(ISip.ECallStatus.Active);
            return;
          }

          setTimeout(() => {
            remoteAudio.current.play();
          }, 2000);
          setCallStatus(ISip.ECallStatus.Active);
        });


        if (
          sipState.callDirection === ISip.ECallDirection.Incoming &&
          autoAnswer
        ) {
          logger.log('Answer auto: ON');
          // this.answerCall();
        } else if (
          sipState.callDirection === ISip.ECallDirection.Incoming &&
          !autoAnswer
        ) {
          logger.log('Answer auto: OFF');
        } else if (sipState.callDirection === ISip.ECallDirection.Outgoing) {
          logger.log('Outgoing call');
        }
      });


    const extraHeadersRegister = extraHeaders?.register || [];
    if (extraHeadersRegister.length) {
      ua.registrator().setExtraHeaders(extraHeadersRegister);
    }
    ua.start();
  };

  return {
    sip: sipState,
    registerSip,
    unregisterSip,
    answerCall,
    startCall,
    stopCall,
  };
};

export default SipProvider;