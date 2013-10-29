Object.freeze(G_CCONST = {
    ACK: 'ack',
    CREATE: '.c',
    DELETE: '.d',
    INIT: '.i',
    READ: '.r',
    UPDATE: '.u',
// reserved session keys
    SESSION_REQ: 'req',
    SESSION_RES: 'res',
    SESSION_JOBS: 'jobs',
    SESSION_ACKS: 'acks',
// channel header key
    CHANNEL: 'pico-channel', // channel id
// standard header params
    API: 'api',
    DATA: 'data',
    REQ_ID: 'reqId',
    RES_ID: 'resId',
    DATE: 'date', // packet date
    KEY: 'key', // hmac key
    MODEL_SEP: '.',
});
