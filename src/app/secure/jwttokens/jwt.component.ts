import { Component } from '@angular/core';
import { UserLoginService } from '../../service/user-login.service';
import { CognitoUtil, LoggedInCallback } from '../../service/cognito.service';
import { Router } from '@angular/router';

export class Stuff {
    public accessToken: string;
    public idToken: string;
    public openIdToken: string;
}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './jwt.html'
})
export class JwtComponent implements LoggedInCallback {
    public stuff: Stuff = new Stuff();

    constructor(public router: Router, public userService: UserLoginService, public cognitoUtil: CognitoUtil) {
        this.userService.isAuthenticated(this);
        console.log('in JwtComponent');

    }

    async isLoggedIn(message: string, isLoggedIn: boolean) {
        if (!isLoggedIn) {
            this.router.navigate(['/home/login']);
        } else {
            // トークンの取得
            this.stuff.accessToken = await this.cognitoUtil.getAccessToken();
            this.stuff.idToken = await this.cognitoUtil.getIdToken();
            this.stuff.openIdToken = await this.cognitoUtil.getOpenIdToken();

            // https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_zThi0j1fe/.well-known/jwks.json
            // https://devalon.biz/node-jsdeaws-cognito-user-pools-noakusesutokunwojian-zheng-suru/

            // const cognitoIdentity = new CognitoIdentity();
            // const getIdResponse = await cognitoIdentity.getId({
            //     IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            //     Logins: logins
            // }).promise();
            // console.log('getIdResponse:', getIdResponse);
        }
    }
}
