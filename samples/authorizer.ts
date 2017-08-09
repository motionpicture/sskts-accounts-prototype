import * as fs from 'fs-extra';
import * as jwt from 'jsonwebtoken';
const jwkToPem = require('jwk-to-pem');
import * as readline from 'readline';
import * as request from 'request-promise-native';

export interface IOpenIdConfiguration {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    response_types_supported: string[];
    subject_types_supported: string[];
    version: string;
    id_token_signing_alg_values_supported: string[];
    x509_url: string;
}

export interface IPems {
    [key: string]: string;
}

export interface IJwk {
    kty: string;
    alg: string;
    use: string;
    kid: string;
    n: string;
    e: string;
}

export type IPayload = any;

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

rl.question('トークンを入力してください\n', async (token) => {
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
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});

export async function createPems() {
    const openidConfiguration: IOpenIdConfiguration = await request({
        url: `${ISSUER}/.well-known/openid-configuration`,
        json: true
    }).then((body) => body);

    const pems = await request({
        url: openidConfiguration.jwks_uri,
        json: true
    }).then((body) => {
        console.log('got jwks_uri', body);
        const pemsByKid: IPems = {};
        (<any[]>body['keys']).forEach((key) => {
            pemsByKid[key.kid] = jwkToPem(key);
        });

        return pemsByKid;
    });

    await fs.writeFile(`${__dirname}/pems.json`, JSON.stringify(pems));

    return pems;
};

export async function validateToken(pems: IPems, token: string, pemittedAudiences: string[]): Promise<IPayload> {
    console.log('validating token...');
    const decodedJwt = <any>jwt.decode(token, { complete: true });
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

    return new Promise<IPayload>((resolve, reject) => {
        // Verify the signature of the JWT token to ensure it's really coming from your User Pool
        jwt.verify(token, pem, {
            issuer: ISSUER,
            audience: pemittedAudiences
        }, (err, payload) => {
            if (err) {
                reject(err);
            } else {
                // sub is UUID for a user which is never reassigned to another user.
                resolve(payload);
            }
        });
    });
}
