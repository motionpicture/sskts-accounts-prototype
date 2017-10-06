import { Inject, Injectable } from '@angular/core';
import { CognitoCallback, CognitoUtil } from './cognito.service';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { RegistrationUser } from '../public/auth/register/registration.component';
import { NewPasswordUser } from '../public/auth/newpassword/newpassword.component';
import * as AWS from 'aws-sdk/global';

/**
 * 会員登録サービス
 */
@Injectable()
export class UserRegistrationService {
    constructor( @Inject(CognitoUtil) public cognitoUtil: CognitoUtil) {
    }

    /**
     * 登録する
     * @param user 登録したいユーザー情報
     * @param callback 実行後処理
     */
    register(user: RegistrationUser, callback: CognitoCallback): void {
        console.log('UserRegistrationService: user is ' + user);

        let attributeList = [];

        let dataEmail = {
            Name: 'email',
            Value: user.email
        };
        let dataGivenName = {
            Name: 'given_name',
            Value: user.givenName
        };
        let dataFamilyName = {
            Name: 'family_name',
            Value: user.familyName
        };
        let dataPhoneNumber = {
            Name: 'phone_number',
            Value: user.phoneNumber
        };
        attributeList.push(new CognitoUserAttribute(dataEmail));
        attributeList.push(new CognitoUserAttribute(dataGivenName));
        attributeList.push(new CognitoUserAttribute(dataFamilyName));
        attributeList.push(new CognitoUserAttribute(dataPhoneNumber));

        this.cognitoUtil.getUserPool().signUp(user.username, user.password, attributeList, null, function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                console.log('UserRegistrationService: registered user is ' + result);
                callback.cognitoCallback(null, result);
            }
        });

    }

    /**
     * 登録確認コードを検証する
     * @param username ユーザーネーム
     * @param confirmationCode 確認コード
     * @param callback 実行後処理
     */
    confirmRegistration(username: string, confirmationCode: string, callback: CognitoCallback): void {
        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new CognitoUser(userData);

        cognitoUser.confirmRegistration(confirmationCode, true, function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                callback.cognitoCallback(null, result);
            }
        });
    }

    /**
     * 確認コードを再送信する
     * @param username ユーザーネーム
     * @param callback 実行後処理
     */
    resendCode(username: string, callback: CognitoCallback): void {
        let userData = {
            Username: username,
            Pool: this.cognitoUtil.getUserPool()
        };

        let cognitoUser = new CognitoUser(userData);

        cognitoUser.resendConfirmationCode(function (err, result) {
            if (err) {
                callback.cognitoCallback(err.message, null);
            } else {
                callback.cognitoCallback(null, result);
            }
        });
    }

    /**
     * パスワードを変更する
     * @param newPasswordUser 新パスワードユーザー
     * @param callback 実行後処理
     */
    newPassword(newPasswordUser: NewPasswordUser, callback: CognitoCallback): void {
        console.log(newPasswordUser);
        // Get these details and call
        // cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
        let authenticationData = {
            Username: newPasswordUser.username,
            Password: newPasswordUser.existingPassword,
        };
        let authenticationDetails = new AuthenticationDetails(authenticationData);

        let userData = {
            Username: newPasswordUser.username,
            Pool: this.cognitoUtil.getUserPool()
        };

        console.log('UserLoginService: Params set...Authenticating the user');
        let cognitoUser = new CognitoUser(userData);
        console.log('UserLoginService: config is ' + AWS.config);
        cognitoUser.authenticateUser(authenticationDetails, {
            newPasswordRequired: function (userAttributes, requiredAttributes) {
                // User was signed up by an admin and must provide new
                // password and required attributes, if any, to complete
                // authentication.

                // the api doesn't accept this field back
                delete userAttributes.email_verified;
                cognitoUser.completeNewPasswordChallenge(newPasswordUser.password, requiredAttributes, {
                    onSuccess: function (result) {
                        callback.cognitoCallback(null, userAttributes);
                    },
                    onFailure: function (err) {
                        callback.cognitoCallback(err, null);
                    }
                });
            },
            onSuccess: function (result) {
                callback.cognitoCallback(null, result);
            },
            onFailure: function (err) {
                callback.cognitoCallback(err, null);
            }
        });
    }
}
