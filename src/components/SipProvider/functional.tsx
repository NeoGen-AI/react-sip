import * as React from "react";
import * as JsSIP from "jssip";
import * as PropTypes from "prop-types";
import dummyLogger from "../../lib/dummyLogger";
import {
  CALL_DIRECTION_INCOMING,
  CALL_DIRECTION_OUTGOING,
  CALL_STATUS_ACTIVE,
  CALL_STATUS_IDLE,
} from "../../lib/enums";

import { ISip } from 'lib/interfaces'




const SipProvider = ({
  host, port,
  pathname, user,
  password, autoRegister
}) => {
  const [userAgent, setUserAgent] = React.useState<null | any>(null);
  const [rtcSession, setRtcSession] = React.useState<null | any>(null)
  const logger = dummyLogger;

  const setSipStatus = (
    status: ISip.EStatus,
    error?: ISip.IError
  ) => {
    if (error) {
      logger.debug("Error", error.message, error.data);
    }
    // this.setState({
    //   sipStatus: SIP_STATUS_ERROR,
    //   sipErrorType: SIP_ERROR_TYPE_CONFIGURATION,
    //   sipErrorMessage: error.message,
    // });
  }

  const setCallStatus = (
    status: ISip.ECallStatus,
    direction?: ISip.ECallDirection | null,
    counterpart?: string | null
  ) => {
  }

  const reinitializeJsSIP = () => {
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
      ({ originator, session, request: rtcRequest }) => {
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
        if (rtcSession) {
          logger.debug('incoming call replied with 486 "Busy Here"');
          session.terminate({
            status_code: 486,
            reason_phrase: "Busy Here",
          });
          return;
        }
        setRtcSession(session);

        rtcSession.on("failed", () => {
          // if (this.ua !== ua) {
          //   return;
          // }
          setRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null)
  
        });

        rtcSession.on("ended", () => {
          // if (this.ua !== ua) {
          //   return;
          // }
          setRtcSession(null);
          setCallStatus(ISip.ECallStatus.Idle, null, null)

        });

        rtcSession.on("accepted", () => {
          // if (this.ua !== ua) {
          //   return;
          // }

          [
            this.remoteAudio.srcObject,
          ] = rtcSession.connection.getRemoteStreams();
          // const played = this.remoteAudio.play();
          const played = this.remoteAudio.play();

          if (typeof played !== "undefined") {
            played
              .catch(() => {
                /**/
              })
              .then(() => {
                setTimeout(() => {
                  this.remoteAudio.play();
                }, 2000);
              });
            this.setState({ callStatus: CALL_STATUS_ACTIVE });
            return;
          }

          setTimeout(() => {
            this.remoteAudio.play();
          }, 2000);

          this.setState({ callStatus: CALL_STATUS_ACTIVE });
        });

        if (
          this.state.callDirection === CALL_DIRECTION_INCOMING &&
          this.props.autoAnswer
        ) {
          logger.log("Answer auto ON");
          this.answerCall();
        } else if (
          this.state.callDirection === CALL_DIRECTION_INCOMING &&
          !this.props.autoAnswer
        ) {
          logger.log("Answer auto OFF");
        } else if (this.state.callDirection === CALL_DIRECTION_OUTGOING) {
          logger.log("OUTGOING call");
        }
      },
    );

    const extraHeadersRegister = this.props.extraHeaders.register || [];
    if (extraHeadersRegister.length) {
      userAgent.registrator().setExtraHeaders(extraHeadersRegister);
    }
    userAgent.start();
  }
}
}