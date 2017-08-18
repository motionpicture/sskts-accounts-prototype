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
        // 試しに外部フローで取得したid_tokenを固定で使ってみる
        // tslint:disable-next-line:max-line-length
        // const token = 'eyJraWQiOiJ1M24zUDVIMXBFeURUbU1iTGdISUV0bld5NVZcL1wvOTNjVzlKdmFHZTlHNUU9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJhOTZhNzZhZi04YmZhLTQwMmUtYmEzMC1kYmYxNDk0NmU0M2QiLCJhdWQiOiI2ZmlndW4xMmdjZHRsajllNTNwMnUzb3F2bCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTUwMzA0ODYyMiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLW5vcnRoZWFzdC0xX3pUaGkwajFmZSIsIm5pY2tuYW1lIjoiaWxvdmVnYWRkIiwiY29nbml0bzp1c2VybmFtZSI6Imlsb3ZlZ2FkZEBnbWFpbC5jb20iLCJleHAiOjE1MDMwNTIyMjIsImlhdCI6MTUwMzA0ODYyMiwiZW1haWwiOiJpbG92ZWdhZGRAZ21haWwuY29tIn0.Q2XCoaWUIdt7DN6bjQOu3R5ArECL5utrOP48U4O2_PK4YqurR7GD5qqdDloM4JceIxxv_8-Bt_fQNefXYDpUZUIQVr01Eyrvz4hURj2dUJfmSEmxcVpxQmtyr11w5XmQr05v_ROijZx-AjI4jcYdazLoVJGM9mS2GgHqe-HWwB8dnajzNg4aKKgPlfnmbLVwPXtt1ch0g5rXh2zYvN68f-MeNNyBdGIMzUY_-bQ1qKlpW3zKKUQVyIoHPkzl4xFzToZEEhN-p4fHTimJL9zzotJ1W5L30AmsyB8W_aq_2ABC6Qm1_j3-okcqiTDeF9En1hoXkUjJPqOAbpvLZYKVqw';
        // isLoggedIn = true;
        // console.log('AppComponent: the user is authenticated: ' + isLoggedIn);
        // this.awsUtil.initAwsService(isLoggedIn, token);

        console.log('AppComponent: the user is authenticated: ' + isLoggedIn);
        const token = await this.cognito.getIdToken();
        this.awsUtil.initAwsService(isLoggedIn, token);
    }
}

