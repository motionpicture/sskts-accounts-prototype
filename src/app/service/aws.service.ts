import { Injectable } from '@angular/core';
import { CognitoUtil } from './cognito.service';
import * as AWS from 'aws-sdk/global';

/**
 * Created by Vladimir Budilov
 */

// declare var AMA: any;

@Injectable()
export class AwsUtil {
    public static firstLogin = false;
    public static runningInit = false;

    constructor(public cognitoUtil: CognitoUtil) {
        AWS.config.region = CognitoUtil._REGION;
    }

    /**
     * This is the method that needs to be called in order to init the aws global creds
     */
    initAwsService(isLoggedIn: boolean, idToken: string) {
        if (AwsUtil.runningInit) {
            // Need to make sure I don't get into an infinite loop here, so need to exit if this method is running already
            console.log('AwsUtil: Aborting running initAwsService()...it\'s running already.');

            return;
        }

        console.log('AwsUtil: Running initAwsService()');
        AwsUtil.runningInit = true;

        // First check if the user is authenticated already
        if (isLoggedIn) {
            this.setupAWS(isLoggedIn, idToken);
        }
    }

    /**
     * Sets up the AWS global params
     *
     * @param isLoggedIn
     */
    setupAWS(isLoggedIn: boolean, idToken: string): void {
        console.log('AwsUtil: in setupAWS()');
        if (isLoggedIn) {
            console.log('AwsUtil: User is logged in');
            // Setup mobile analytics
            // const options = {
            //     appId: '32673c035a0b40e99d6e1f327be0cb60',
            //     appTitle: 'aws-cognito-angular2-quickstart'
            // };

            // TODO: The mobile Analytics client needs some work to handle Typescript. Disabling for the time being.
            // var mobileAnalyticsClient = new AMA.Manager(options);
            // mobileAnalyticsClient.submitEvents();

            this.addCognitoCredentials(idToken);

            console.log('AwsUtil: Retrieving the id token');
        } else {
            console.log('AwsUtil: User is not logged in');
        }

        AwsUtil.runningInit = false;
    }

    async addCognitoCredentials(idTokenJwt: string): Promise<void> {
        const params = CognitoUtil.getCognitoParametersForIdConsolidation(idTokenJwt);
        const creds = await this.cognitoUtil.buildCognitoCreds(params.Logins);

        AWS.config.credentials = creds;

        creds.get((err) => {
            if (!err) {
                if (AwsUtil.firstLogin) {
                    // save the login info to DDB
                    // this.ddb.writeLogEntry('login');
                    AwsUtil.firstLogin = false;
                }
            }
        });
    }
}
