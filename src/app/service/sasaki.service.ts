import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import * as sasaki from '@motionpicture/sasaki-api';

@Injectable()
export class SasakiService {
    public credentials: any;
    public auth: sasaki.IImplicitGrantClient;
    public events: sasaki.service.Event;
    public people: sasaki.service.Person;

    constructor() {
        this.credentials = null;

        const scopes = [
            'phone', 'openid', 'email', 'aws.cognito.signin.user.admin', 'profile',
            'https://sskts-api-development.azurewebsites.net/transactions',
            'https://sskts-api-development.azurewebsites.net/events.read-only',
            'https://sskts-api-development.azurewebsites.net/organizations.read-only',
            'https://sskts-api-development.azurewebsites.net/people.contacts',
            'https://sskts-api-development.azurewebsites.net/people.creditCards',
            'https://sskts-api-development.azurewebsites.net/people.ownershipInfos.read-only'
        ];

        const options = {
            domain: environment.sasakiAuthDomain,
            clientId: environment.clientId,
            responseType: 'token',
            redirectUri: environment.sasakiAuthRedirectUri,
            logoutUri: environment.sasakiAuthLogoutUri,
            scope: scopes.join(' '),
            state: '12345',
            nonce: null,
            tokenIssuer: environment.tokenIssuer
        };

        this.auth = sasaki.createAuthInstance(options);

        this.people = new sasaki.service.Person({
            auth: this.auth,
            endpoint: environment.sasakiAPIEndpoint
        });

        this.events = new sasaki.service.Event({
            auth: this.auth,
            endpoint: environment.sasakiAPIEndpoint
        });
    }
}
