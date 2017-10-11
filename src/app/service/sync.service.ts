import { Injectable } from '@angular/core';
import { CognitoUtil } from './cognito.service';
import * as CognitoSync from 'aws-sdk/clients/cognitosync';

export class Profile {
    givenName: string;
    familyName: string;
    phoneNumber: string;
}

@Injectable()
export class CognitoSyncService {
    public syncSessionToken: string;
    public syncCount: number;
    public cognitoSync: CognitoSync;

    constructor(public cognitoUtil: CognitoUtil) {
        console.log('CognitoSyncService: constructor');

        this.cognitoSync = new CognitoSync({
            credentials: this.cognitoUtil.getCognitoCreds()
        });
    }

    async getProfile() {
        const profile = new Profile();

        const response = await this.cognitoSync.listRecords({
            DatasetName: 'profile',
            IdentityId: await this.cognitoUtil.getCognitoIdentity(),
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            LastSyncCount: 0,
            // MaxResults: 0,
            // NextToken: 'STRING_VALUE',
            SyncSessionToken: this.syncSessionToken
        }).promise();
        console.log('listRecordsResonse:', response);

        this.syncSessionToken = response.SyncSessionToken;
        response.Records.forEach((record) => {
            profile[record.Key] = record.Value;
        });

        return profile;
    }

    async setProfile(profile: Profile) {
        if (this.syncSessionToken === undefined) {
            await this.getProfile();
        }

        const recordPatches = Object.keys(profile).map((key) => {
            return {
                Key: key,
                Op: 'replace',
                SyncCount: 0,
                // DeviceLastModifiedDate: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
                Value: profile[key]
            };
        });

        const response = await this.cognitoSync.updateRecords({
            DatasetName: 'profile',
            IdentityId: await this.cognitoUtil.getCognitoIdentity(),
            IdentityPoolId: CognitoUtil._IDENTITY_POOL_ID,
            SyncSessionToken: this.syncSessionToken,
            // ClientContext: 'STRING_VALUE',
            // DeviceId: 'STRING_VALUE',
            RecordPatches: recordPatches
        }).promise();
        console.log('updateRecordsResponse:', response);

        this.syncSessionToken = undefined;
    }
}
