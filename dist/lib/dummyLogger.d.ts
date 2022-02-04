declare const dummyLogger: {
    log: (...args: any) => void;
    error: (...args: any) => void;
    warn: (...args: any) => void;
    debug: (...args: any) => void;
};
export default dummyLogger;
