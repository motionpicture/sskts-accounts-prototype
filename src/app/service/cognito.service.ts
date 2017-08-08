import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk/global';
import * as CognitoIdentity from 'aws-sdk/clients/cognitoidentity';

/**
 * Created by Vladimir Budilov
 */

export interface CognitoCallback {
    cognitoCallback(message: string, result: any): void;
}

export interface LoggedInCallback {
    isLoggedIn(message: string, loggedIn: boolean): Promise<void>;
}

/**
 * Googleでサインインした場合のコールバック
 */
export interface SignedInWithGoogleCallback {
    isSignedInWithGoogle(message: string, signedIn: boolean): void;
}

@Injectable()
export class CognitoUtil {
    public static _REGION = environment.region;

    public static _IDENTITY_POOL_ID = environment.identityPoolId;
    public static _USER_POOL_ID = environment.userPoolId;
    public static _CLIENT_ID = environment.clientId;

    public static _POOL_DATA: any = {
        UserPoolId: CognitoUtil._USER_POOL_ID,
        ClientId: CognitoUtil._CLIENT_ID
    };

    public cognitoCreds: AWS.CognitoIdentityCredentials;
    public logins: CognitoIdentity.LoginsMap;

    static getCognitoParametersForIdConsolidation(idTokenJwt: string) {
        console.log('AwsUtil: enter getCognitoParametersForIdConsolidation()');
        const url = `cognito-idp.${CognitoUtil._REGION.toLowerCase()}.amazonaws.com/${CognitoUtil._USER_POOL_ID}`;
        const logins: CognitoIdentity.LoginsMap = {};
        logins[url] = idTokenJwt;
        const params = {
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            Logins: logins
        };

        return params;
    }

    getUserPool() {
        if (environment.cognito_idp_endpoint) {
            CognitoUtil._POOL_DATA.endpoint = environment.cognito_idp_endpoint;
        }
        return new CognitoUserPool(CognitoUtil._POOL_DATA);
    }

    getCurrentUser() {
        return this.getUserPool().getCurrentUser();
    }

    // AWS Stores Credentials in many ways, and with TypeScript this means that 
    // getting the base credentials we authenticated with from the AWS globals gets really murky,
    // having to get around both class extension and unions. Therefore, we're going to give
    // developers direct access to the raw, unadulterated CognitoIdentityCredentials
    // object at all times.
    setCognitoCreds(creds: AWS.CognitoIdentityCredentials) {
        this.cognitoCreds = creds;
    }

    getCognitoCreds() {
        return this.cognitoCreds;
    }

    /**
     * ローカルセッションに認証情報を作成する
     */
    async buildCognitoCreds(logins: CognitoIdentity.LoginsMap) {
        console.log('logins:', logins);
        this.logins = logins;

        const params = {
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            Logins: logins
        };
        const creds = new AWS.CognitoIdentityCredentials(params);
        console.log('creds:', creds);
        this.setCognitoCreds(creds);

        // const getCredentialsForIdentityResponse = await cognitoIdentity.getCredentialsForIdentity({
        //     IdentityId: getIdResponse.IdentityId,
        //     Logins: logins
        // }).promise();
        // console.log('getCredentialsForIdentityResponse:', getCredentialsForIdentityResponse);

        return creds;
    }

    /**
     * cognito identity idを取得する
     */
    async getCognitoIdentity(): Promise<string> {
        if (this.logins === undefined) {
            return null;
        }

        const cognitoIdentity = new CognitoIdentity();

        const getIdResponse = await cognitoIdentity.getId({
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            Logins: this.logins
        }).promise();
        console.log('getIdResponse:', getIdResponse);

        return getIdResponse.IdentityId;
    }

    async getAccessToken(): Promise<string | null> {
        console.log('アクセストークンを取得します...');
        return new Promise<string | null>((resolve, reject) => {
            if (this.getCurrentUser() != null) {
                this.getCurrentUser().getSession((err, session) => {
                    if (err) {
                        console.log('CognitoUtil: Can\'t set the credentials:' + err);
                        reject(err);
                    } else {
                        if (session.isValid()) {
                            console.log('アクセストークンを取得しました', session.getAccessToken());
                            resolve(session.getAccessToken().getJwtToken());
                        } else {
                            resolve(null);
                        }
                    }
                });
            } else {
                resolve(null);
            }
        });
    }

    async getOpenIdToken() {
        console.log('OpenIDトークンを取得します...');
        const cognitoIdentity = new CognitoIdentity();
        const getOpenIdTokenResponse = await cognitoIdentity.getOpenIdToken({
            IdentityId: await this.getCognitoIdentity(),
            Logins: this.logins
        }).promise();
        console.log('OpenIDトークンを取得しました', getOpenIdTokenResponse);

        return getOpenIdTokenResponse.Token;
    }

    async getIdToken(): Promise<string | null> {
        console.log('IDトークンを取得します...');
        return new Promise<string | null>((resolve, reject) => {
            if (this.getCurrentUser() != null) {
                this.getCurrentUser().getSession((err, session) => {
                    if (err) {
                        console.log('CognitoUtil: Can\'t set the credentials:' + err);
                        resolve(null);
                    } else {
                        if (session.isValid()) {
                            console.log('IDトークンを取得しました', session.getIdToken());
                            resolve(session.getIdToken().getJwtToken());
                        } else {
                            console.log('CognitoUtil: Got the id token, but the session isn\'t valid');
                            resolve(null);
                        }
                    }
                });
            } else {
                resolve(null);
            }
        });
    }

    async getRefreshToken(): Promise<string | null> {
        return new Promise<string | null>((resolve, reject) => {
            if (this.getCurrentUser() != null) {
                this.getCurrentUser().getSession(function (err, session) {
                    if (err) {
                        console.log('CognitoUtil: Can\'t set the credentials:' + err);
                        reject(err);
                    } else {
                        if (session.isValid()) {
                            resolve(session.getRefreshToken());
                        }
                    }
                });
            } else {
                resolve(null);
            }
        });
    }

    async refresh(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getCurrentUser().getSession(async (err, session) => {
                if (err) {
                    console.log('CognitoUtil: Can\'t set the credentials:' + err);
                    reject(err);
                } else {
                    if (session.isValid()) {
                        console.log('CognitoUtil: refreshed successfully');
                        resolve();
                    } else {
                        console.log('CognitoUtil: refreshed but session is still not valid');
                        reject(new Error('CognitoUtil: refreshed but session is still not valid'));
                    }
                }
            });
        });
    }
}
