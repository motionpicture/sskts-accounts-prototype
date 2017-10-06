import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserLoginService } from '../../../service/user-login.service';
import { CognitoCallback } from '../../../service/cognito.service';

/**
 * パスワード忘れ(step1)コンポーネント
 */
@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './forgotPassword.html'
})
export class ForgotPasswordStep1Component implements CognitoCallback {
    username: string;
    errorMessage: string;

    constructor(public router: Router,
        public userService: UserLoginService) {
        this.errorMessage = null;
    }

    onNext() {
        if (this.username == null) {
            this.errorMessage = 'All fields are required';
            return;
        }

        this.errorMessage = null;
        this.userService.forgotPassword(this.username, this);
    }

    cognitoCallback(message: string, result: any) {
        if (message == null && result == null) { // success
            this.router.navigate(['/home/forgotPassword', this.username]);
        } else { // error
            this.errorMessage = message;
        }
    }
}

/**
 * パスワード忘れ(step2)コンポーネント
 */
@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './forgotPasswordStep2.html'
})
export class ForgotPassword2Component implements CognitoCallback, OnInit, OnDestroy {

    verificationCode: string;
    username: string;
    password: string;
    errorMessage: string;
    private sub: any;

    constructor(public router: Router, public route: ActivatedRoute,
        public userService: UserLoginService) {
        console.log('username from the url: ' + this.username);
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.username = params['username'];

        });
        this.errorMessage = null;
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    onNext() {
        this.errorMessage = null;
        this.userService.confirmNewPassword(this.username, this.verificationCode, this.password, this);
    }

    cognitoCallback(message: string) {
        if (message != null) { // error
            this.errorMessage = message;
            console.log('result: ' + this.errorMessage);
        } else { // success
            this.router.navigate(['/home/login']);
        }
    }
}
