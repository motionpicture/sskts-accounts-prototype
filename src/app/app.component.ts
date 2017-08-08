/**
 * @author Vladimir Budilov
 *
 * This is the entry-way into the routing logic. This is the first component that's called when the app
 * loads.
 *
 */
import { Component, OnInit } from '@angular/core';
import { AwsUtil } from './service/aws.service';
import { UserLoginService } from './service/user-login.service';
import { CognitoUtil, LoggedInCallback } from './service/cognito.service';

@Component({
    selector: 'app-root',
    templateUrl: 'template/app.html'
})
export class AppComponent implements OnInit, LoggedInCallback {
    constructor(public awsUtil: AwsUtil, public userService: UserLoginService, public cognito: CognitoUtil) {
        console.log('AppComponent: constructor');
    }

    ngOnInit() {
        console.log('AppComponent: Checking if the user is already authenticated');
        this.userService.isAuthenticated(this);
    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        console.log('AppComponent: the user is authenticated: ' + isLoggedIn);
        const token = await this.cognito.getIdToken();
        this.awsUtil.initAwsService(isLoggedIn, token);
    }
}

