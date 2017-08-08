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
    redirectUri: string;
    scope: string;
    state: string;
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

        // GET https://login.microsoftonline.com/{tenant}/oauth2/authorize?
        // client_id = 6731de76- 14a6- 49ae- 97bc- 6eba6914391e
        // & response_type=id_token
        // & redirect_uri=http % 3A% 2F% 2Flocalhost% 2Fmyapp% 2F
        // & response_mode=form_post
        // & scope=openid
        // & state=12345
        // & nonce=7362CAEA- 9CA5- 4B43- 9BA3- 34D7C303EBA7

        this.authorizeParams = new AuthorizeParams();
        const queryParams = this.activatedRoute.snapshot.queryParams;
        this.authorizeParams.clientId = queryParams['client_id'];
        this.authorizeParams.redirectUri = queryParams['redirect_uri'];
        this.authorizeParams.responseType = queryParams['response_type'];
        this.authorizeParams.scope = queryParams['scope'];
        this.authorizeParams.state = queryParams['state'];
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
        const idToken = await this.cognitoUtil.getIdToken();
        console.log('id token published', idToken);

        const headers = new Headers({ 'Content-Type': 'application/json' });
        // const options = new Http.RequestOptions();
        this.http.post('/authorize', this.payload, {
            responseType: 1,
            headers: headers
        }).subscribe(
            res => {
                console.log(res);
                console.log(res.json());
                const credentials = res.json();
                // tslint:disable-next-line:max-line-length
                const url = `${this.authorizeParams.redirectUri}#access_token=${credentials.access_token}&state=${this.authorizeParams.state}`;
                console.log('redirecting...', url);
                window.location.href = url;
            },
            error => alert(error)
            );
    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login'], {
                queryParams: {
                    cb: this.router.url
                }
            });
        } else {
            // id_tokenを発行して
            const idToken = await this.cognitoUtil.getIdToken();
            console.log('id token published', idToken);

            this.payload.client_id = this.authorizeParams.clientId;
            this.payload.state = this.authorizeParams.state;
            this.payload.scope = this.authorizeParams.scope;
            this.payload.logins = this.cognitoUtil.logins;
        }
    }
}
