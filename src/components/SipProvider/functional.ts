import * as React from "react";
import * as JsSIP from "jssip";

import dummyLogger from "lib/dummyLogger";
import { ISip } from 'lib/interfaces'
import { defaultState, SipReducer, updateReducer } from 'lib/reducer'



const SipProvider = ({
  config,
  options: {
    autoRegister,
    autoAnswer,
    extraHeaders,
    debug
  },
  children,
}) => {
  const [userAgent, setUserAgent] = React.useState<null | any>(null);
  const [activeRtcSession, setActiveRtcSession] = React.useState<null | any>(null);
  const [logger, setLogger] = React.useState<any | null>(dummyLogger);
  const [sipState, dispatch] = React.useReducer(SipReducer, defaultState);
  const remoteAudio = React.useRef<any>(null);
  const { host, port, pathname, user, password } = config;

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
    if (window.document.getElementById("sip-provider-audio")) {
      throw new Error(
        `Creating two SipProviders in one application is forbidden. If that's not the case ` +
        `then check if you're using "sip-provider-audio" as id attribute for any existing ` +
        `element`,
      );
    }
    remoteAudio.current = window.document.createElement("audio");
    remoteAudio.current.id = "sip-provider-audio";
    window.document.body.appendChild(remoteAudio.current);
  }

  const configureDebug = () => {
    if (debug) {
      JsSIP.debug.enable("JsSIP:*");
      setLogger(console);
    } else {
      JsSIP.debug.disable();
      setLogger(dummyLogger);
    }
  }

  const setSipStatus = (
    status: ISip.EStatus,
    error?: ISip.IError
  ) => {
    if (error) {
      logger.debug("Error", error.message, error.data);
    }
    dispatch(updateReducer({ status, error }))

  }

  const setCallStatus = (
    status: ISip.ECallStatus,
    direction?: ISip.ECallDirection | null,
    counterpart?: string | null
  ) => {

    dispatch(updateReducer({
      callStatus: status,
      callDirection: direction,
      callCounterpart: counterpart
    }))
  }

  const initializeJsSIP = () => {
    if (userAgent) {
      userAgent.stop();
      setUserAgent(null);
      return;
    }

    if (!host || !port || !user) {
      setSipStatus(ISip.EStatus.Disconnected)
      return;
    }

    try {
      const socket = new JsSIP.WebSocketInterface(
        `wss://${host}:${port}${pathname}`,
      );
      const ua = new JsSIP.UA({
        uri: `sip:${user}@${host}`,
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
      })
      return;
    }

    userAgent.on("connecting", () => {
      logger.debug('UA "connecting" event');
      setSipStatus(ISip.EStatus.Connecting)
    });

    userAgent.on("connected", () => {
      logger.debug('UA "connected" event');
      setSipStatus(ISip.EStatus.Connected)
    });

    userAgent.on("disconnected", () => {
      logger.debug('UA "disconnected" event');
      setSipStatus(ISip.EStatus.Error,
        {
          type: ISip.EErrorTypes.Connection,
          message: 'disconnected'
        }
      )
    });

    userAgent.on("registered", (data) => {
      logger.debug('UA "registered" event', data);
      setSipStatus(ISip.EStatus.Registered);
      setCallStatus(ISip.ECallStatus.Idle)
    });

    userAgent.on("unregistered", () => {
      logger.debug('UA "unregistered" event');
      if (userAgent.isConnected()) {
        setSipStatus(ISip.EStatus.Connected);
        setCallStatus(ISip.ECallStatus.Idle, null);
      } else {
        setSipStatus(ISip.EStatus.Disconnected);
        setCallStatus(ISip.ECallStatus.Idle, null);
      }
    });

    userAgent.on("registrationFailed", (data) => {
      logger.debug('UA "registrationFailed" event');
      setSipStatus(ISip.EStatus.Error, {
        type: ISip.EErrorTypes.Registration,
        message: data
      })
    });

    userAgent.on(
      "newRTCSession",
      ({ originator, session: newRtcSession, request: rtcRequest }) => {
        // if (!this || this.ua !== ua) {
        //   return;
        // }

        // identify call direction
        if (originator === "local") {
          const foundUri = rtcRequest.to.toString();
          const delimiterPosition = foundUri.indexOf(";") || null;
          setCallStatus(
            ISip.ECallStatus.Starting,
            ISip.ECallDirection.Outgoing,
            foundUri.substring(0, delimiterPosition) || foundUri
          )
        } else if (originator === "remote") {
          const foundUri = rtcRequest.from.toString();
          const delimiterPosition = foundUri.indexOf(";") || null;
          setCallStatus(
            ISip.ECallStatus.Starting,
            ISip.ECallDirection.Incoming,
            foundUri.substring(0, delimiterPosition) || foundUri
          )
        }

        // Avoid if busy or other incoming
        if (activeRtcSession) {
          logger.debug('incoming call replied with 486 "Busy Here"');
          newRtcSession.terminate({
            status_code: 486,
            reason_phrase: "Busy Here",
          });
          return;
        }

        setActiveRtcSession(newRtcSession);

        newRtcSession.on("failed", () => {
          setActiveRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null)

        });

        newRtcSession.on("ended", () => {
          setActiveRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null)

        });

        newRtcSession.on("accepted", () => {
          [
            remoteAudio.current.srcObject,
          ] = newRtcSession.connection.getRemoteStreams();
          const played = remoteAudio.current.play();

          if (typeof played !== "undefined") {
            played
              .catch(() => {
                /**/
              })
              .then(() => {
                setTimeout(() => {
                  remoteAudio.current.play();
                }, 2000);
              });
            setCallStatus(ISip.ECallStatus.Active)
            return;
          }

          setTimeout(() => {
            remoteAudio.current.play();
          }, 2000);
          setCallStatus(ISip.ECallStatus.Active)
        });


        if (
          sipState.callDirection === ISip.ECallDirection.Incoming &&
          autoAnswer
        ) {
          logger.log("Answer auto: ON");
          // this.answerCall();
        } else if (
          sipState.callDirection === ISip.ECallDirection.Incoming &&
          !autoAnswer
        ) {
          logger.log("Answer auto: OFF");
        } else if (sipState.callDirection === ISip.ECallDirection.Outgoing) {
          logger.log("Outgoing call");
        }
      })


    const extraHeadersRegister = extraHeaders.register || [];
    if (extraHeadersRegister.length) {
      userAgent.registrator().setExtraHeaders(extraHeadersRegister);
    }
    userAgent.start();
  }

  return children;
}

export default SipProvider;