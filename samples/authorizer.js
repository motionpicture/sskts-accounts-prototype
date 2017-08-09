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
const readline = require("readline");
const request = require("request-promise-native");
// tslint:disable-next-line:max-line-length
// const ISSUER = 'https://cognito-identity.amazonaws.com';
const ISSUER = `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_zThi0j1fe`;
const permittedAudiences = [
    '4flh35hcir4jl73s3puf7prljq',
    '6figun12gcdtlj9e53p2u3oqvl'
];
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('トークンを入力してください\n', (token) => __awaiter(this, void 0, void 0, function* () {
    try {
        // const pemsFromJson: IPems = require('./pems.json');
        // validateToken(pemsFromJson, OPEN_ID_TOEN).then((payload) => {
        //     console.log('verified! payload:', payload);
        // }).catch((error) => {
        //     console.error(error);
        // });
        createPems().then((pems) => {
            validateToken(pems, token, permittedAudiences).then((payload) => {
                console.log('verified! payload:', payload);
                process.exit(0);
            }).catch((error) => {
                console.error(error);
                process.exit(1);
            });
        });
    }
    catch (error) {
        console.error(error);
        process.exit(1);
    }
}));
function createPems() {
    return __awaiter(this, void 0, void 0, function* () {
        const openidConfiguration = yield request({
            url: `${ISSUER}/.well-known/openid-configuration`,
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
function validateToken(pems, token, pemittedAudiences) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('validating token...');
        const decodedJwt = jwt.decode(token, { complete: true });
        if (!decodedJwt) {
            throw new Error('invalid JWT token');
        }
        console.log('decodedJwt:', decodedJwt);
        // if (decodedJwt.payload.aud !== AUDIENCE) {
        //     throw new Error('invalid audience');
        // }
        // Get the kid from the token and retrieve corresponding PEM
        const pem = pems[decodedJwt.header.kid];
        if (!pem) {
            throw new Error(`corresponding pem undefined. kid:${decodedJwt.header.kid}`);
        }
        return new Promise((resolve, reject) => {
            // Verify the signature of the JWT token to ensure it's really coming from your User Pool
            jwt.verify(token, pem, {
                issuer: ISSUER,
                audience: pemittedAudiences
            }, (err, payload) => {
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
