"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var JsSIP = require("jssip");
var PropTypes = require("prop-types");
var React = require("react");
var dummyLogger_1 = require("../../lib/dummyLogger");
var enums_1 = require("../../lib/enums");
var types_1 = require("../../lib/types");
var SipProvider = (function (_super) {
    __extends(SipProvider, _super);
    function SipProvider(props) {
        var _this = _super.call(this, props) || this;
        _this.registerSip = function () {
            if (_this.props.autoRegister) {
                throw new Error("Calling registerSip is not allowed when autoRegister === true");
            }
            if (_this.state.sipStatus !== enums_1.SIP_STATUS_CONNECTED) {
                throw new Error("Calling registerSip is not allowed when sip status is ".concat(_this.state.sipStatus, " (expected ").concat(enums_1.SIP_STATUS_CONNECTED, ")"));
            }
            return _this.ua.register();
        };
        _this.unregisterSip = function () {
            if (_this.props.autoRegister) {
                throw new Error("Calling registerSip is not allowed when autoRegister === true");
            }
            if (_this.state.sipStatus !== enums_1.SIP_STATUS_REGISTERED) {
                throw new Error("Calling unregisterSip is not allowed when sip status is ".concat(_this.state.sipStatus, " (expected ").concat(enums_1.SIP_STATUS_CONNECTED, ")"));
            }
            return _this.ua.unregister();
        };
        _this.answerCall = function () {
            if (_this.state.callStatus !== enums_1.CALL_STATUS_STARTING ||
                _this.state.callDirection !== enums_1.CALL_DIRECTION_INCOMING) {
                throw new Error("Calling answerCall() is not allowed when call status is ".concat(_this.state.callStatus, " and call direction is ").concat(_this.state.callDirection, "  (expected ").concat(enums_1.CALL_STATUS_STARTING, " and ").concat(enums_1.CALL_DIRECTION_INCOMING, ")"));
            }
            _this.state.rtcSession.answer({
                mediaConstraints: {
                    audio: true,
                    video: false,
                },
                pcConfig: {
                    iceServers: _this.props.iceServers,
                },
            });
        };
        _this.startCall = function (destination) {
            console.error("xyz");
            if (!destination) {
                throw new Error("Destination must be defined (".concat(destination, " given)"));
            }
            if (_this.state.sipStatus !== enums_1.SIP_STATUS_CONNECTED &&
                _this.state.sipStatus !== enums_1.SIP_STATUS_REGISTERED) {
                throw new Error("Calling startCall() is not allowed when sip status is ".concat(_this.state.sipStatus, " (expected ").concat(enums_1.SIP_STATUS_CONNECTED, " or ").concat(enums_1.SIP_STATUS_REGISTERED, ")"));
            }
            if (_this.state.callStatus !== enums_1.CALL_STATUS_IDLE) {
                throw new Error("Calling startCall() is not allowed when call status is ".concat(_this.state.callStatus, " (expected ").concat(enums_1.CALL_STATUS_IDLE, ")"));
            }
            var _a = _this.props, iceServers = _a.iceServers, sessionTimersExpires = _a.sessionTimersExpires;
            var extraHeaders = _this.props.extraHeaders.invite;
            var options = {
                extraHeaders: extraHeaders,
                mediaConstraints: { audio: true, video: false },
                rtcOfferConstraints: { iceRestart: _this.props.iceRestart },
                pcConfig: {
                    iceServers: iceServers,
                },
                sessionTimersExpires: sessionTimersExpires,
            };
            _this.ua.call(destination, options);
            _this.setState({ callStatus: enums_1.CALL_STATUS_STARTING });
        };
        _this.stopCall = function () {
            _this.setState({ callStatus: enums_1.CALL_STATUS_STOPPING });
            _this.ua.terminateSessions();
        };
        _this.state = {
            sipStatus: enums_1.SIP_STATUS_DISCONNECTED,
            sipErrorType: null,
            sipErrorMessage: null,
            rtcSession: null,
            callStatus: enums_1.CALL_STATUS_IDLE,
            callDirection: null,
            callCounterpart: null,
        };
        _this.ua = null;
        return _this;
    }
    SipProvider.prototype.getChildContext = function () {
        return {
            sip: __assign(__assign({}, this.props), { status: this.state.sipStatus, errorType: this.state.sipErrorType, errorMessage: this.state.sipErrorMessage }),
            call: {
                id: "??",
                status: this.state.callStatus,
                direction: this.state.callDirection,
                counterpart: this.state.callCounterpart,
            },
            registerSip: this.registerSip,
            unregisterSip: this.unregisterSip,
            answerCall: this.answerCall,
            startCall: this.startCall,
            stopCall: this.stopCall,
        };
    };
    SipProvider.prototype.componentDidMount = function () {
        if (window.document.getElementById("sip-provider-audio")) {
            throw new Error("Creating two SipProviders in one application is forbidden. If that's not the case " +
                "then check if you're using \"sip-provider-audio\" as id attribute for any existing " +
                "element");
        }
        this.remoteAudio = window.document.createElement("audio");
        this.remoteAudio.id = "sip-provider-audio";
        window.document.body.appendChild(this.remoteAudio);
        this.reconfigureDebug();
        this.reinitializeJsSIP();
    };
    SipProvider.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.debug !== prevProps.debug) {
            this.reconfigureDebug();
        }
        if (this.props.host !== prevProps.host ||
            this.props.port !== prevProps.port ||
            this.props.pathname !== prevProps.pathname ||
            this.props.user !== prevProps.user ||
            this.props.password !== prevProps.password ||
            this.props.autoRegister !== prevProps.autoRegister) {
            this.reinitializeJsSIP();
        }
    };
    SipProvider.prototype.componentWillUnmount = function () {
        this.remoteAudio.parentNode.removeChild(this.remoteAudio);
        delete this.remoteAudio;
        if (this.ua) {
            this.ua.stop();
            this.ua = null;
        }
    };
    SipProvider.prototype.reconfigureDebug = function () {
        var debug = this.props.debug;
        if (debug) {
            JsSIP.debug.enable("JsSIP:*");
            this.logger = console;
        }
        else {
            JsSIP.debug.disable();
            this.logger = dummyLogger_1.default;
        }
    };
    SipProvider.prototype.reinitializeJsSIP = function () {
        var _this = this;
        if (this.ua) {
            this.ua.stop();
            this.ua = null;
        }
        var _a = this.props, host = _a.host, port = _a.port, pathname = _a.pathname, user = _a.user, password = _a.password, autoRegister = _a.autoRegister;
        if (!host || !port || !user) {
            this.setState({
                sipStatus: enums_1.SIP_STATUS_DISCONNECTED,
                sipErrorType: null,
                sipErrorMessage: null,
            });
            return;
        }
        try {
            var socket = new JsSIP.WebSocketInterface("wss://".concat(host, ":").concat(port).concat(pathname));
            this.ua = new JsSIP.UA({
                uri: "sip:".concat(user, "@").concat(host),
                password: password,
                sockets: [socket],
                register: autoRegister,
            });
        }
        catch (error) {
            this.logger.debug("Error", error.message, error);
            this.setState({
                sipStatus: enums_1.SIP_STATUS_ERROR,
                sipErrorType: enums_1.SIP_ERROR_TYPE_CONFIGURATION,
                sipErrorMessage: error.message,
            });
            return;
        }
        var ua = this.ua;
        ua.on("connecting", function () {
            _this.logger.debug('UA "connecting" event');
            if (_this.ua !== ua) {
                return;
            }
            _this.setState({
                sipStatus: enums_1.SIP_STATUS_CONNECTING,
                sipErrorType: null,
                sipErrorMessage: null,
            });
        });
        ua.on("connected", function () {
            _this.logger.debug('UA "connected" event');
            if (_this.ua !== ua) {
                return;
            }
            _this.setState({
                sipStatus: enums_1.SIP_STATUS_CONNECTED,
                sipErrorType: null,
                sipErrorMessage: null,
            });
        });
        ua.on("disconnected", function () {
            _this.logger.debug('UA "disconnected" event');
            if (_this.ua !== ua) {
                return;
            }
            _this.setState({
                sipStatus: enums_1.SIP_STATUS_ERROR,
                sipErrorType: enums_1.SIP_ERROR_TYPE_CONNECTION,
                sipErrorMessage: "disconnected",
            });
        });
        ua.on("registered", function (data) {
            _this.logger.debug('UA "registered" event', data);
            if (_this.ua !== ua) {
                return;
            }
            _this.setState({
                sipStatus: enums_1.SIP_STATUS_REGISTERED,
                callStatus: enums_1.CALL_STATUS_IDLE,
            });
        });
        ua.on("unregistered", function () {
            _this.logger.debug('UA "unregistered" event');
            if (_this.ua !== ua) {
                return;
            }
            if (ua.isConnected()) {
                _this.setState({
                    sipStatus: enums_1.SIP_STATUS_CONNECTED,
                    callStatus: enums_1.CALL_STATUS_IDLE,
                    callDirection: null,
                });
            }
            else {
                _this.setState({
                    sipStatus: enums_1.SIP_STATUS_DISCONNECTED,
                    callStatus: enums_1.CALL_STATUS_IDLE,
                    callDirection: null,
                });
            }
        });
        ua.on("registrationFailed", function (data) {
            _this.logger.debug('UA "registrationFailed" event');
            if (_this.ua !== ua) {
                return;
            }
            _this.setState({
                sipStatus: enums_1.SIP_STATUS_ERROR,
                sipErrorType: enums_1.SIP_ERROR_TYPE_REGISTRATION,
                sipErrorMessage: data,
            });
        });
        ua.on("newRTCSession", function (_a) {
            var originator = _a.originator, rtcSession = _a.session, rtcRequest = _a.request;
            if (!_this || _this.ua !== ua) {
                return;
            }
            if (originator === "local") {
                var foundUri = rtcRequest.to.toString();
                var delimiterPosition = foundUri.indexOf(";") || null;
                _this.setState({
                    callDirection: enums_1.CALL_DIRECTION_OUTGOING,
                    callStatus: enums_1.CALL_STATUS_STARTING,
                    callCounterpart: foundUri.substring(0, delimiterPosition) || foundUri,
                });
            }
            else if (originator === "remote") {
                var foundUri = rtcRequest.from.toString();
                var delimiterPosition = foundUri.indexOf(";") || null;
                _this.setState({
                    callDirection: enums_1.CALL_DIRECTION_INCOMING,
                    callStatus: enums_1.CALL_STATUS_STARTING,
                    callCounterpart: foundUri.substring(0, delimiterPosition) || foundUri,
                });
            }
            var rtcSessionInState = _this.state.rtcSession;
            if (rtcSessionInState) {
                _this.logger.debug('incoming call replied with 486 "Busy Here"');
                rtcSession.terminate({
                    status_code: 486,
                    reason_phrase: "Busy Here",
                });
                return;
            }
            _this.setState({ rtcSession: rtcSession });
            rtcSession.on("failed", function () {
                if (_this.ua !== ua) {
                    return;
                }
                _this.setState({
                    rtcSession: null,
                    callStatus: enums_1.CALL_STATUS_IDLE,
                    callDirection: null,
                    callCounterpart: null,
                });
            });
            rtcSession.on("ended", function () {
                if (_this.ua !== ua) {
                    return;
                }
                _this.setState({
                    rtcSession: null,
                    callStatus: enums_1.CALL_STATUS_IDLE,
                    callDirection: null,
                    callCounterpart: null,
                });
            });
            rtcSession.on("accepted", function () {
                if (_this.ua !== ua) {
                    return;
                }
                _this.remoteAudio.srcObject = rtcSession.connection.getRemoteStreams()[0];
                var played = _this.remoteAudio.play();
                if (typeof played !== "undefined") {
                    played
                        .catch(function () {
                    })
                        .then(function () {
                        setTimeout(function () {
                            _this.remoteAudio.play();
                        }, 2000);
                    });
                    _this.setState({ callStatus: enums_1.CALL_STATUS_ACTIVE });
                    return;
                }
                setTimeout(function () {
                    _this.remoteAudio.play();
                }, 2000);
                _this.setState({ callStatus: enums_1.CALL_STATUS_ACTIVE });
            });
            if (_this.state.callDirection === enums_1.CALL_DIRECTION_INCOMING &&
                _this.props.autoAnswer) {
                _this.logger.log("Answer auto ON");
                _this.answerCall();
            }
            else if (_this.state.callDirection === enums_1.CALL_DIRECTION_INCOMING &&
                !_this.props.autoAnswer) {
                _this.logger.log("Answer auto OFF");
            }
            else if (_this.state.callDirection === enums_1.CALL_DIRECTION_OUTGOING) {
                _this.logger.log("OUTGOING call");
            }
        });
        var extraHeadersRegister = this.props.extraHeaders.register || [];
        if (extraHeadersRegister.length) {
            ua.registrator().setExtraHeaders(extraHeadersRegister);
        }
        ua.start();
    };
    SipProvider.prototype.render = function () {
        return this.props.children;
    };
    SipProvider.childContextTypes = {
        sip: types_1.sipPropType,
        call: types_1.callPropType,
        registerSip: PropTypes.func,
        unregisterSip: PropTypes.func,
        answerCall: PropTypes.func,
        startCall: PropTypes.func,
        stopCall: PropTypes.func,
    };
    SipProvider.propTypes = {
        host: PropTypes.string,
        port: PropTypes.number,
        pathname: PropTypes.string,
        user: PropTypes.string,
        password: PropTypes.string,
        autoRegister: PropTypes.bool,
        autoAnswer: PropTypes.bool,
        iceRestart: PropTypes.bool,
        sessionTimersExpires: PropTypes.number,
        extraHeaders: types_1.extraHeadersPropType,
        iceServers: types_1.iceServersPropType,
        debug: PropTypes.bool,
        children: PropTypes.node,
    };
    SipProvider.defaultProps = {
        host: null,
        port: null,
        pathname: "",
        user: null,
        password: null,
        autoRegister: true,
        autoAnswer: false,
        iceRestart: false,
        sessionTimersExpires: 120,
        extraHeaders: { register: [], invite: [] },
        iceServers: [],
        debug: false,
        children: null,
    };
    return SipProvider;
}(React.Component));
exports.default = SipProvider;
//# sourceMappingURL=index.js.map