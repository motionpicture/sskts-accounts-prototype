import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserLoginService } from '../../../service/user-login.service';
import { CognitoCallback, LoggedInCallback, SignedInWithGoogleCallback } from '../../../service/cognito.service';
import { DynamoDBService } from '../../../service/ddb.service';

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './login.html'
})
export class LoginComponent implements CognitoCallback, LoggedInCallback, SignedInWithGoogleCallback, OnInit {
    /**
     * ログイン後の遷移先
     */
    cb: string;
    username: string;
    password: string;
    googleUser: any;
    errorMessage: string;

    constructor(
        public activatedRoute: ActivatedRoute,
        public router: Router,
        public ddb: DynamoDBService,
        public userService: UserLoginService
    ) {
        console.log('LoginComponent constructor');
    }

    ngOnInit() {
        this.errorMessage = null;
        console.log('Checking if the user is already authenticated. If so, then redirect to the secure site');
        this.userService.isAuthenticated(this);

        (<any>window).onSignInWithGoogle = (googleUser) => this.onSignInWithGoogle.call(this, googleUser);

        this.cb = this.activatedRoute.snapshot.queryParams['cb'];
        console.log('this.cb:', this.cb);
    }

    async onLogin() {
        if (this.username == null || this.password == null) {
            this.errorMessage = 'All fields are required';
            return;
        }

        this.errorMessage = null;
        const authenticateResult = await this.userService.authenticate(this.username, this.password);
        this.cognitoCallback(authenticateResult.message, authenticateResult.result);
    }

    cognitoCallback(message: string, result: any) {
        if (message != null) {
            this.errorMessage = message;
            console.log('result: ' + this.errorMessage);
            if (this.errorMessage === 'User is not confirmed.') {
                console.log('redirecting');
                this.router.navigate(['/home/confirmRegistration', this.username]);
            } else if (this.errorMessage === 'User needs to set password.') {
                console.log('redirecting to set new password');
                this.router.navigate(['/home/newPassword']);
            }
        } else {
            this.ddb.writeLogEntry('login');

            console.log('redirecting...', this.cb);
            if (this.cb) {
                // this.router.navigateByUrl(this.cb);
                window.location.href = this.cb;
            } else {
                this.router.navigate(['/securehome']);
            }
        }
    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        if (isLoggedIn) {
            this.router.navigate(['/securehome']);
        }
    }

    isSignedInWithGoogle(message: string, isLoggedIn: boolean) {
        if (isLoggedIn) {
            this.router.navigate(['/securehome']);
        } else {
        }
    }

    /**
     * Googleでサインイン時に実行されるイベント
     */
    onSignInWithGoogle(googleUser) {
        console.log('googleUser:', googleUser);
        if (googleUser === undefined) {
            return;
        }

        this.googleUser = googleUser;

        const profile = googleUser.getBasicProfile();
        console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
        console.log('Name: ' + profile.getName());
        console.log('Image URL: ' + profile.getImageUrl());
        console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

        console.log('googleUser.getAuthResponse() is', googleUser.getAuthResponse());
        // document.getElementById('idToken').innerText = googleUser.getAuthResponse().id_token;

        this.userService.signInWithGoogle(googleUser.getAuthResponse().id_token, this);
    }

    signOutFromGoogle() {
        const auth2 = (<any>window).gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            console.log('User signed out.');
        });
    }
}