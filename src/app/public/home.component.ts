import { Component, OnInit } from "@angular/core";
import { SasakiService } from '../service/sasaki.service';

declare let AWS: any;
declare let AWSCognito: any;

@Component({
    selector: 'awscognito-angular2-app',
    template: '<p>Hello and welcome!"</p>'
})
export class AboutComponent {

}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './landinghome.html'
})
export class HomeLandingComponent {
    constructor(
        public sasaki: SasakiService
    ) {
        console.log("HomeLandingComponent constructor");
    }

    onLogin() {
        console.log('onLogin...');

        this.sasaki.auth.authorize().then(function (result) {
            console.log('authorize result:', result);
            this.sasakiAuthService.credentials = result;

            this.onSignIn();
        }).catch(function (err) {
            console.error(err);
        });
    }

    onSignIn() {
        console.log('onSignIn...');
    }
}

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './home.html'
})
export class HomeComponent implements OnInit {

    constructor() {
        console.log("HomeComponent constructor");
    }

    ngOnInit() {

    }
}


