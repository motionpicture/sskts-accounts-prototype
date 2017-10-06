import { Component, OnInit } from '@angular/core';
import { SasakiService } from '../service/sasaki.service';

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

        this.sasaki.auth.isSignedIn().then(async (result) => {
            this.isSignedIn = (result !== null);
            console.log('isSignedIn:', this.isSignedIn);

            const events = await this.sasaki.events.searchIndividualScreeningEvent({
                day: '20170822',
                theater: '118'
            });
            if (events.length > 0) {
                console.log('events[0].workPerformed.name:', events[0].workPerformed.name);
            }
        });
    }

    async onLogin() {
        console.log('onLogin...');

        try {
            const result = await this.sasaki.auth.signIn();
            console.log('authorize result:', result);
            this.sasaki.credentials = result;
            this.isSignedIn = true;

            const creditCards = await this.sasaki.people.findCreditCards({
                personId: 'me'
            });
            console.log('creditCards:', creditCards);
        } catch (error) {
            console.error(error);
        }
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


