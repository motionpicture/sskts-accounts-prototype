"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const jwt = require("jsonwebtoken");
const jwkToPem = require('jwk-to-pem');
const request = require("request-promise-native");
// tslint:disable-next-line:max-line-length
const OPEN_ID_TOEN = 'eyJraWQiOiJhcC1ub3J0aGVhc3QtMTEiLCJ0eXAiOiJKV1MiLCJhbGciOiJSUzUxMiJ9.eyJzdWIiOiJhcC1ub3J0aGVhc3QtMTpmNDc5YzljNS04YjlkLTQxNDctOGI3OS0wNjAxZjkwN2YyM2MiLCJhdWQiOiJhcC1ub3J0aGVhc3QtMTo2YTY3ZjUyMy05M2MzLTQ3NjYtYjk2Zi02NTUyZjIxYWJkOGQiLCJhbXIiOlsiYXV0aGVudGljYXRlZCIsImNvZ25pdG8taWRwLmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb20vYXAtbm9ydGhlYXN0LTFfelRoaTBqMWZlIiwiY29nbml0by1pZHAuYXAtbm9ydGhlYXN0LTEuYW1hem9uYXdzLmNvbS9hcC1ub3J0aGVhc3QtMV96VGhpMGoxZmU6Q29nbml0b1NpZ25JbjphOTZhNzZhZi04YmZhLTQwMmUtYmEzMC1kYmYxNDk0NmU0M2QiXSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkZW50aXR5LmFtYXpvbmF3cy5jb20iLCJleHAiOjE1MDIxNzk4NDgsImlhdCI6MTUwMjE3OTI0OH0.HfxEGFeFsAgKmQB5s6LaQTopcCN_nEO5fCo4TzVDquSoL5GJ_9ds7SbJJPbPEN33zW1cdF_gjlPi5u33w2nTYZwItjDTGwu0QM547ta49t1_T6Rm9YuS5NcJglZTry7Ech8zMvGEqiKtSeyYc59D3lOmBmyAHqCD2hB6IH-ihjYiPiMR30dkixa79MzGvfwhtn0cNdGkdfAP9gW8Kmj6mpA6hxW8RTC3a4_yIc-G0poia41q2RjG52RLRFJBH_k7tPl4jS153Iy1_PKWnqumCEOHnzh85tLJtLc3-9_qORoR0m5UEmC2w5-3bB22Pi_C8CtRFUf5eLv7Mk0-uAV8cQ';
const AUDIENCE = 'ap-northeast-1:6a67f523-93c3-4766-b96f-6552f21abd8d'; // identity pool id
const ISSUER = 'https://cognito-identity.amazonaws.com';
const pemsFromJson = require('./pems.json');
validateToken(pemsFromJson, OPEN_ID_TOEN).then((payload) => {
    console.log('verified! payload:', payload);
}).catch((error) => {
    console.error(error);
});
// createPems().then((pems) => {
//     validateToken(pems, OPEN_ID_TOEN).then((payload) => {
//         console.log('verified! payload:', payload);
//     }).catch((error) => {
//         console.error(error);
//     });
// });
function createPems() {
    return __awaiter(this, void 0, void 0, function* () {
        const openidConfiguration = yield request({
            url: ISSUER + '/.well-known/openid-configuration',
            json: true
        }).then((body) => body);
        const pems = yield request({
            url: openidConfiguration.jwks_uri,
            json: true
        }).then((body) => {
            console.log('got jwks_uri', body);
            const pemsByKid = {};
            body['keys'].forEach((key) => {
                pemsByKid[key.kid] = jwkToPem(key);
            });
            return pemsByKid;
        });
        yield fs.writeFile(`${__dirname}/pems.json`, JSON.stringify(pems));
        return pems;
    });
}
exports.createPems = createPems;
;
function validateToken(pems, token) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('validating token...');
        const decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
            throw new Error('invalid JWT token');
        }
        console.log('decodedJwt:', decodedJwt);
        if (decodedJwt.payload.aud !== AUDIENCE) {
            throw new Error('invalid audience');
        }
        // Get the kid from the token and retrieve corresponding PEM
        const pem = pems[decodedJwt.header.kid];
        if (!pem) {
            throw new Error(`corresponding pem undefined. kid:${decodedJwt.header.kid}`);
        }
        return new Promise((resolve, reject) => {
            // Verify the signature of the JWT token to ensure it's really coming from your User Pool
            jwt.verify(token, pem, { issuer: ISSUER }, (err, payload) => {
                if (err) {
                    reject(err);
                }
                else {
                    // sub is UUID for a user which is never reassigned to another user.
                    resolve(payload);
                }
            });
        });
    });
}
exports.validateToken = validateToken;
