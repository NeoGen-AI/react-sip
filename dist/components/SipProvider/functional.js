"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var JsSIP = require("jssip");
var dummyLogger_1 = require("../../lib/dummyLogger");
var interfaces_1 = require("../../lib/interfaces");
var reducer_1 = require("../../lib/reducer");
var SipProvider = function (_a) {
    var config = _a.config, _b = _a.options, autoRegister = _b.autoRegister, autoAnswer = _b.autoAnswer, extraHeaders = _b.extraHeaders, debug = _b.debug, children = _a.children;
    var _c = React.useState(null), userAgent = _c[0], setUserAgent = _c[1];
    var _d = React.useState(null), activeRtcSession = _d[0], setActiveRtcSession = _d[1];
    var _e = React.useState(dummyLogger_1.default), logger = _e[0], setLogger = _e[1];
    var _f = React.useReducer(reducer_1.SipReducer, reducer_1.defaultState), sipState = _f[0], dispatch = _f[1];
    var remoteAudio = React.useRef(null);
    var host = config.host, port = config.port, pathname = config.pathname, user = config.user, password = config.password;
    React.useEffect(function () {
        mountAudioElement();
    }, []);
    React.useEffect(function () {
        initializeJsSIP();
    }, Object.values(config));
    React.useEffect(function () {
        configureDebug();
    }, [debug]);
    var mountAudioElement = function () {
        if (window.document.getElementById("sip-provider-audio")) {
            throw new Error("Creating two SipProviders in one application is forbidden. If that's not the case " +
                "then check if you're using \"sip-provider-audio\" as id attribute for any existing " +
                "element");
        }
        remoteAudio.current = window.document.createElement("audio");
        remoteAudio.current.id = "sip-provider-audio";
        window.document.body.appendChild(remoteAudio.current);
    };
    var configureDebug = function () {
        if (debug) {
            JsSIP.debug.enable("JsSIP:*");
            setLogger(console);
        }
        else {
            JsSIP.debug.disable();
            setLogger(dummyLogger_1.default);
        }
    };
    var setSipStatus = function (status, error) {
        if (error) {
            logger.debug("Error", error.message, error.data);
        }
        dispatch((0, reducer_1.updateReducer)({ status: status, error: error }));
    };
    var setCallStatus = function (status, direction, counterpart) {
        dispatch((0, reducer_1.updateReducer)({
            callStatus: status,
            callDirection: direction,
            callCounterpart: counterpart
        }));
    };
    var initializeJsSIP = function () {
        if (userAgent) {
            userAgent.stop();
            setUserAgent(null);
            return;
        }
        if (!host || !port || !user) {
            setSipStatus(interfaces_1.ISip.EStatus.Disconnected);
            return;
        }
        try {
            var socket = new JsSIP.WebSocketInterface("wss://".concat(host, ":").concat(port).concat(pathname));
            var ua = new JsSIP.UA({
                uri: "sip:".concat(user, "@").concat(host),
                password: password,
                sockets: [socket],
                register: autoRegister,
            });
            setUserAgent(ua);
        }
        catch (error) {
            setSipStatus(interfaces_1.ISip.EStatus.Error, {
                type: interfaces_1.ISip.EErrorTypes.Configuration,
                message: error.message,
                data: error
            });
            return;
        }
        userAgent.on("connecting", function () {
            logger.debug('UA "connecting" event');
            setSipStatus(interfaces_1.ISip.EStatus.Connecting);
        });
        userAgent.on("connected", function () {
            logger.debug('UA "connected" event');
            setSipStatus(interfaces_1.ISip.EStatus.Connected);
        });
        userAgent.on("disconnected", function () {
            logger.debug('UA "disconnected" event');
            setSipStatus(interfaces_1.ISip.EStatus.Error, {
                type: interfaces_1.ISip.EErrorTypes.Connection,
                message: 'disconnected'
            });
        });
        userAgent.on("registered", function (data) {
            logger.debug('UA "registered" event', data);
            setSipStatus(interfaces_1.ISip.EStatus.Registered);
            setCallStatus(interfaces_1.ISip.ECallStatus.Idle);
        });
        userAgent.on("unregistered", function () {
            logger.debug('UA "unregistered" event');
            if (userAgent.isConnected()) {
                setSipStatus(interfaces_1.ISip.EStatus.Connected);
                setCallStatus(interfaces_1.ISip.ECallStatus.Idle, null);
            }
            else {
                setSipStatus(interfaces_1.ISip.EStatus.Disconnected);
                setCallStatus(interfaces_1.ISip.ECallStatus.Idle, null);
            }
        });
        userAgent.on("registrationFailed", function (data) {
            logger.debug('UA "registrationFailed" event');
            setSipStatus(interfaces_1.ISip.EStatus.Error, {
                type: interfaces_1.ISip.EErrorTypes.Registration,
                message: data
            });
        });
        userAgent.on("newRTCSession", function (_a) {
            var originator = _a.originator, newRtcSession = _a.session, rtcRequest = _a.request;
            if (originator === "local") {
                var foundUri = rtcRequest.to.toString();
                var delimiterPosition = foundUri.indexOf(";") || null;
                setCallStatus(interfaces_1.ISip.ECallStatus.Starting, interfaces_1.ISip.ECallDirection.Outgoing, foundUri.substring(0, delimiterPosition) || foundUri);
            }
            else if (originator === "remote") {
                var foundUri = rtcRequest.from.toString();
                var delimiterPosition = foundUri.indexOf(";") || null;
                setCallStatus(interfaces_1.ISip.ECallStatus.Starting, interfaces_1.ISip.ECallDirection.Incoming, foundUri.substring(0, delimiterPosition) || foundUri);
            }
            if (activeRtcSession) {
                logger.debug('incoming call replied with 486 "Busy Here"');
                newRtcSession.terminate({
                    status_code: 486,
                    reason_phrase: "Busy Here",
                });
                return;
            }
            setActiveRtcSession(newRtcSession);
            newRtcSession.on("failed", function () {
                setActiveRtcSession(null);
                setCallStatus(interfaces_1.ISip.ECallStatus.Idle, null, null);
            });
            newRtcSession.on("ended", function () {
                setActiveRtcSession(null);
                setCallStatus(interfaces_1.ISip.ECallStatus.Idle, null, null);
            });
            newRtcSession.on("accepted", function () {
                remoteAudio.current.srcObject = newRtcSession.connection.getRemoteStreams()[0];
                var played = remoteAudio.current.play();
                if (typeof played !== "undefined") {
                    played
                        .catch(function () {
                    })
                        .then(function () {
                        setTimeout(function () {
                            remoteAudio.current.play();
                        }, 2000);
                    });
                    setCallStatus(interfaces_1.ISip.ECallStatus.Active);
                    return;
                }
                setTimeout(function () {
                    remoteAudio.current.play();
                }, 2000);
                setCallStatus(interfaces_1.ISip.ECallStatus.Active);
            });
            if (sipState.callDirection === interfaces_1.ISip.ECallDirection.Incoming &&
                autoAnswer) {
                logger.log("Answer auto: ON");
            }
            else if (sipState.callDirection === interfaces_1.ISip.ECallDirection.Incoming &&
                !autoAnswer) {
                logger.log("Answer auto: OFF");
            }
            else if (sipState.callDirection === interfaces_1.ISip.ECallDirection.Outgoing) {
                logger.log("Outgoing call");
            }
        });
        var extraHeadersRegister = (extraHeaders === null || extraHeaders === void 0 ? void 0 : extraHeaders.register) || [];
        if (extraHeadersRegister.length) {
            userAgent.registrator().setExtraHeaders(extraHeadersRegister);
        }
        userAgent.start();
    };
    return children;
};
exports.default = SipProvider;
//# sourceMappingURL=functional.js.map