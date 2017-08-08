import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { DynamoDBService } from './ddb.service';
import { CognitoCallback, CognitoUtil, LoggedInCallback, SignedInWithGoogleCallback } from './cognito.service';
import { CognitoSyncService } from './sync.service';
import { AuthenticationDetails, CognitoUser } from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk/global';
import * as STS from 'aws-sdk/clients/sts';

@Injectable()
export class UserLoginService {
    constructor(public ddb: DynamoDBService, public cognitoUtil: CognitoUtil) {
    }

    async authenticate(username: string, password: string) {
        return new Promise<{
            message: string;
            result: any
        }>((resolve) => {

            console.log('UserLoginService: starting the authentication')

            const authenticationData = {
                Username: username,
                Password: password,
            };
            const authenticationDetails = new AuthenticationDetails(authenticationData);

            const userData = {
                Username: username,
                Pool: this.cognitoUtil.getUserPool()
            };

            console.log('UserLoginService: Params set...Authenticating the user');
            let cognitoUser = new CognitoUser(userData);
            console.log('UserLoginService: config is ' + AWS.config);
            cognitoUser.authenticateUser(authenticationDetails, {
                newPasswordRequired: (userAttributes, requiredAttributes) => {
                    resolve({
                        message: `User needs to set password.`,
                        result: null
                    });
                },
                onSuccess: async (result) => {
                    console.log('In authenticateUser onSuccess callback');
                    const creds = await this.cognitoUtil.buildCognitoCreds(
                        CognitoUtil.getCognitoParametersForIdConsolidation(result.getIdToken().getJwtToken()).Logins
                    );

                    AWS.config.credentials = creds;

                    // So, when CognitoIdentity authenticates a user, it doesn't actually hand us the IdentityID,
                    // used by many of our other handlers. This is handled by some sly underhanded calls to AWS Cognito
                    // API's by the SDK itself, automatically when the first AWS SDK request is made that requires our
                    // security credentials. The identity is then injected directly into the credentials object.
                    // If the first SDK call we make wants to use our IdentityID, we have a
                    // chicken and egg problem on our hands. We resolve this problem by 'priming' the AWS SDK by calling a
                    // very innocuous API call that forces this behavior.
                    const clientParams: any = {};
                    if (environment.sts_endpoint) {
                        clientParams.endpoint = environment.sts_endpoint;
                    }
                    const sts = new STS(clientParams);
                    sts.getCallerIdentity(function (err, data) {
                        console.log('UserLoginService: Successfully set the AWS credentials');
                        resolve({
                            message: null,
                            result: result
                        });
                    });

                },
                onFailure: function (err) {
                    resolve({
                        message: err.message,
                        result: null
                    });
                },
            });
        });
    }

    forgotPassword(username: string, callback: CognitoCallback) {
        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function () {

            },
            onFailure: function (err) {
                callback.cognitoCallback(err.message, null);
            },
            inputVerificationCode() {
                callback.cognitoCallback(null, null);
            }
        });
    }

    confirmNewPassword(email: string, verificationCode: string, password: string, callback: CognitoCallback) {
        let userData = {
            Username: email,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, password, {
            onSuccess: function () {
                callback.cognitoCallback(null, null);
            },
            onFailure: function (err) {
                callback.cognitoCallback(err.message, null);
            }
        });
    }

    logout() {
        console.log('UserLoginService: Logging out');
        this.ddb.writeLogEntry('logout');
        this.cognitoUtil.getCurrentUser().signOut();

    }

    /**
     * 認証済かどうか
     */
    async isAuthenticated(callback: LoggedInCallback) {
        if (callback == null) {
            throw ('UserLoginService: Callback in isAuthenticated() cannot be null');
        }

        const cognitoUser = this.cognitoUtil.getCurrentUser();

        if (cognitoUser != null) {
            cognitoUser.getSession(async (err, session) => {
                if (err) {
                    console.log('UserLoginService: Couldn\'t get the session: ' + err, err.stack);
                    await callback.isLoggedIn(err, false);
                } else {
                    console.log('UserLoginService: Session is ' + session.isValid());
                    await callback.isLoggedIn(err, session.isValid());
                }
            });
        } else {
            console.log('UserLoginService: can\'t retrieve the current user');
            await callback.isLoggedIn('Can\'t retrieve the CurrentUser', false);
        }
    }

    async signInWithGoogle(idToken: string, callback: SignedInWithGoogleCallback) {
        console.log('Adding the Google access token to the Cognito credentials login map...');
        // Add the Google access token to the Cognito credentials login map.
        const credentials = await this.cognitoUtil.buildCognitoCreds({
            'accounts.google.com': idToken
        });
        AWS.config.credentials = credentials;

        // Obtain AWS credentials
        await (<AWS.CognitoIdentityCredentials>AWS.config.credentials).getPromise();

        // cognitoSyncサービスを使ってみる
        const sync = new CognitoSyncService(this.cognitoUtil);
        let profile = await sync.getProfile();
        console.log('profile:', profile);

        await this.cognitoUtil.getOpenIdToken();

        await sync.setProfile({
            givenName: 'めい',
            familyName: 'めい',
            phoneNumber: '09012345678',
        });

        profile = await sync.getProfile();
        console.log('profile:', profile);

        const cognitoUser = this.cognitoUtil.getCurrentUser();
        callback.isSignedInWithGoogle('', (cognitoUser != null));
    }
}
