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
// standard header params
    API: 'api',
    DATA: 'data',
    REQ_ID: 'reqId',
    RES_ID: 'resId',
    DATE: 'date', // packet date
    KEY: 'key', // hmac key
    MODEL_SEP: '.',
});

Object.freeze(G_CERROR = {
    400: {code: 400, msg:'Bad Request'},
    403: {code: 403, msg:'Forbidden'},
    404: {code: 404, msg:'Not Found'},
    419: {code: 419, msg:'Authentication Timeout'},
    500: {code: 500, msg:'Internal Server Error'},
    501: {code: 501, msg:'Not Implemented'},
});
