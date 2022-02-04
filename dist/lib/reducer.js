"use strict";
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
exports.SipReducer = exports.updateReducer = exports.defaultState = void 0;
var interfaces_1 = require("lib/interfaces");
exports.defaultState = {
    status: interfaces_1.ISip.EStatus.Disconnected,
    error: null,
    callStatus: interfaces_1.ISip.ECallStatus.Idle,
    callDirection: null,
    callCounterpart: null,
};
var updateReducer = function (payload) { return ({
    type: interfaces_1.EActionTypes.UpdateState,
    payload: payload
}); };
exports.updateReducer = updateReducer;
var SipReducer = function (state, _a) {
    var type = _a.type, _b = _a.payload, payload = _b === void 0 ? {} : _b;
    switch (type) {
        case interfaces_1.EActionTypes.UpdateState:
            return __assign(__assign({}, state), payload);
        default:
            return state;
    }
};
exports.SipReducer = SipReducer;
//# sourceMappingURL=reducer.js.map