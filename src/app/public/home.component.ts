import { Component, OnInit } from '@angular/core';
import { SasakiService } from '../service/sasaki.service';

declare let AWS: any;
declare let AWSCognito: any;

@Component({
    selector: 'awscognito-angular2-app',
    template: '<p>Hello and welcome!" < /p>'
})
export class AboutComponent {

}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './landinghome.html'
})
export class HomeLandingComponent {
    public isSignedIn = false;

    constructor(
        public sasaki: SasakiService
    ) {
        console.log('HomeLandingComponent constructor');

        this.sasaki.auth.isSignedIn().then((result) => {
            this.isSignedIn = (result !== null);
            console.log('isSignedIn:', this.isSignedIn);
        });
    }

    onLogin() {
        console.log('onLogin...');

        this.sasaki.auth.signIn().then((result) => {
            console.log('authorize result:', result);
            this.sasaki.credentials = result;
            this.isSignedIn = true;
        }).catch(function (err) {
            console.error(err);
        });
    }

    onLogout() {
        console.log('onLogout...');

        this.sasaki.auth.signOut().then(() => {
            console.log('logout');
            this.sasaki.credentials = null;
            this.isSignedIn = false;
        }).catch(function (err) {
            console.error(err);
        });
    }
}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './home.html'
})
export class HomeComponent implements OnInit {

    constructor() {
        console.log('HomeComponent constructor');
    }

    ngOnInit() {

    }
}


