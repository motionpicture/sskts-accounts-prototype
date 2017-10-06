import { Injectable } from '@angular/core';
import { CognitoUtil } from './cognito.service';

@Injectable()
export class UserParametersService {
    constructor(public cognitoUtil: CognitoUtil) {
    }

    async getParameters() {
        return new Promise<any>((resolve, reject) => {
            const cognitoUser = this.cognitoUtil.getCurrentUser();

            if (cognitoUser != null) {
                cognitoUser.getSession(async (getSessionErr, session) => {
                    if (getSessionErr) {
                        console.log('UserParametersService: Couldn\'t retrieve the user');
                        reject(getSessionErr);
                    } else {
                        cognitoUser.getUserAttributes((getUserAttributesErr, result) => {
                            if (getUserAttributesErr) {
                                console.log('UserParametersService: in getParameters: ' + getUserAttributesErr);
                                reject(new Error('UserParametersService: in getParameters: ' + getUserAttributesErr));
                            } else {
                                resolve(result);
                            }
                        });
                    }

                });
            } else {
                resolve(null);
            }
        });
    }
}
