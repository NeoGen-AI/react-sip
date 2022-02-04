"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECallDirection = exports.ECallStatus = exports.EErrorTypes = exports.EStatus = void 0;
var EStatus;
(function (EStatus) {
    EStatus["Disconnected"] = "sipStatus/DISCONNECTED";
    EStatus["Connecting"] = "sipStatus/CONNECTING";
    EStatus["Connected"] = "sipStatus/CONNECTED";
    EStatus["Registered"] = "sipStatus/REGISTERED";
    EStatus["Error"] = "sipStatus/ERROR";
})(EStatus = exports.EStatus || (exports.EStatus = {}));
var EErrorTypes;
(function (EErrorTypes) {
    EErrorTypes["Configuration"] = "sipErrorType/CONFIGURATION";
    EErrorTypes["Connection"] = "sipErrorType/CONNECTION";
    EErrorTypes["Registration"] = "sipErrorType/REGISTRATION";
})(EErrorTypes = exports.EErrorTypes || (exports.EErrorTypes = {}));
;
var ECallStatus;
(function (ECallStatus) {
    ECallStatus["Idle"] = "callStatus/IDLE";
    ECallStatus["Starting"] = "callStatus/STARTING";
    ECallStatus["Active"] = "callStatus/ACTIVE";
    ECallStatus["Stopping"] = "callStatus/STOPPING";
})(ECallStatus = exports.ECallStatus || (exports.ECallStatus = {}));
var ECallDirection;
(function (ECallDirection) {
    ECallDirection["Incoming"] = "callDirection/INCOMING";
    ECallDirection["Outgoing"] = "callDirection/OUTGOING";
})(ECallDirection = exports.ECallDirection || (exports.ECallDirection = {}));
//# sourceMappingURL=sip.js.map