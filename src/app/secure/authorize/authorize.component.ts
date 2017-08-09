import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Headers, Http } from '@angular/http';
import { UserLoginService } from '../../service/user-login.service';
import { CognitoUtil, LoggedInCallback } from '../../service/cognito.service';
import * as CognitoIdentity from 'aws-sdk/clients/cognitoidentity';

export class Payload {
    logins: CognitoIdentity.LoginsMap;
    client_id: string;
    scope: string;
    state: string;
}

export class AuthorizeParams {
    clientId: string;
    responseType: string;
    responseMode: string;
    redirectUri: string;
    scope: string;
    state: string;
    prompt: string;
}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './authorize.html'
})
export class AuthorizeComponent implements LoggedInCallback, OnInit {
    payload: Payload;
    authorizeParams: AuthorizeParams;
    errorMessage: string;

    constructor(
        public activatedRoute: ActivatedRoute,
        public router: Router,
        public http: Http,
        public userService: UserLoginService,
        public cognitoUtil: CognitoUtil
    ) {
        console.log('LoginComponent constructor');

        this.authorizeParams = new AuthorizeParams();
        const queryParams = this.activatedRoute.snapshot.queryParams;
        this.authorizeParams.clientId = queryParams['client_id'];
        this.authorizeParams.redirectUri = queryParams['redirect_uri'];
        this.authorizeParams.responseType = queryParams['response_type'];
        this.authorizeParams.responseMode = queryParams['response_mode'];
        this.authorizeParams.scope = queryParams['scope'];
        this.authorizeParams.state = queryParams['state'];
        this.authorizeParams.prompt = queryParams['prompt'];
        console.log('this.authorizeParams', this.authorizeParams);

        this.payload = new Payload();
    }

    ngOnInit() {
        this.errorMessage = null;
        console.log('Checking if the user is already authenticated. If so, then redirect to the secure site');
        this.userService.isAuthenticated(this);
    }

    async onAuthorize() {
        this.errorMessage = null;
        console.log('authorize submitted...');

        // id_tokenを発行して、リダイレクト先へ遷移する
        const idToken = await this.cognitoUtil.getIdToken(this.authorizeParams.clientId);
        console.log('id token published', idToken);
        const accessToken = await this.cognitoUtil.getAccessToken(this.authorizeParams.clientId);

        // tslint:disable-next-line:max-line-length
        const url = `${this.authorizeParams.redirectUri}#id_token=${idToken}&access_token=${accessToken}&state=${this.authorizeParams.state}`;
        console.log('redirecting...', url);
        window.location.href = url;
    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login'], {
                queryParams: {
                    cb: this.router.url
                }
            });
        } else {
            // 自動ログインの場合
            if (this.authorizeParams.prompt === 'none') {
                await this.onAuthorize();
            } else {
                this.payload.client_id = this.authorizeParams.clientId;
                this.payload.state = this.authorizeParams.state;
                this.payload.scope = this.authorizeParams.scope;
                this.payload.logins = this.cognitoUtil.logins;
            }
        }
    }
}
