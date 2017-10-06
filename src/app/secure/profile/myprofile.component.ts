import { Component } from '@angular/core';
import { UserLoginService } from '../../service/user-login.service';
import { CognitoUtil, LoggedInCallback } from '../../service/cognito.service';
import { UserParametersService } from '../../service/user-parameters.service';
import { Router } from '@angular/router';

export class Parameters {
    name: string;
    value: string;
}

/**
 * 会員プロフィールコンポーネント
 */
@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './myprofile.html'
})
export class MyProfileComponent implements LoggedInCallback {
    public parameters: Array<Parameters> = [];
    public cognitoId: String;

    constructor(
        public router: Router,
        public userService: UserLoginService,
        public userParams: UserParametersService,
        public cognitoUtil: CognitoUtil
    ) {
        this.userService.isAuthenticated(this);
        console.log('In MyProfileComponent');
    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {
            const result = await this.userParams.getParameters();

            for (let i = 0; i < result.length; i++) {
                let parameter = new Parameters();
                parameter.name = result[i].getName();
                parameter.value = result[i].getValue();
                this.parameters.push(parameter);
            }
            let param = new Parameters();
            param.name = 'cognito ID';
            param.value = await this.cognitoUtil.getCognitoIdentity();
            this.parameters.push(param);
        }
    }
}
