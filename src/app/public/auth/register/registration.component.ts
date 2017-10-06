import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserRegistrationService } from '../../../service/user-registration.service';
import { CognitoCallback } from '../../../service/cognito.service';

/**
 * 会員登録に必須な属性
 * @export
 * @class
 */
export class RegistrationUser {
    username: string;
    email: string;
    password: string;
    givenName: string;
    familyName: string;
    phoneNumber: string;
}
/**
 * 会員登録コンポーネント
 */
@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './registration.html'
})
export class RegisterComponent implements CognitoCallback {
    registrationUser: RegistrationUser;
    router: Router;
    errorMessage: string;

    constructor(public userRegistration: UserRegistrationService, router: Router) {
        this.router = router;
        this.onInit();
    }

    onInit() {
        this.registrationUser = new RegistrationUser();
        this.errorMessage = null;
    }

    onRegister() {
        this.errorMessage = null;
        this.userRegistration.register(this.registrationUser, this);
    }

    /**
     * 会員登録後の遷移
     * @param message 登録失敗時のメッセージ
     * @param result 登録成功時の結果
     */
    cognitoCallback(message: string, result: any) {
        if (message != null) { // error
            this.errorMessage = message;
            console.log('result:', this.errorMessage);
        } else { // success
            // move to the next step
            console.log('redirecting...');
            this.router.navigate(['/home/confirmRegistration', result.user.username]);
        }
    }
}
