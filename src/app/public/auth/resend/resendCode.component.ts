import { Component } from '@angular/core';
import { UserRegistrationService } from '../../../service/user-registration.service';
import { CognitoCallback } from '../../../service/cognito.service';
import { Router } from '@angular/router';

/**
 * 確認コード再送信コンポーネント
 */
@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './resendCode.html'
})
export class ResendCodeComponent implements CognitoCallback {
    username: string;
    errorMessage: string;

    constructor(public registrationService: UserRegistrationService, public router: Router) {
    }

    resendCode() {
        this.registrationService.resendCode(this.username, this);
    }

    cognitoCallback(error: any, result: any) {
        if (error != null) {
            this.errorMessage = 'Something went wrong...please try again';
        } else {
            this.router.navigate(['/home/confirmRegistration', this.username]);
        }
    }
}
