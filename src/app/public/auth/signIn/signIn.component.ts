import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'awscognito-angular2-app',
    templateUrl: './signIn.html'
})
export class SignInComponent implements OnInit {
    constructor() {
        console.log('LoginComponent constructor');
    }

    ngOnInit() {
        if (window.opener !== null) {
            console.log('posting message to opner window...', window.location.hash.slice(0, 30), '...');
            window.opener.postMessage(window.location.hash, '*');
        } else {
            console.log('posting message to parent window...', window.location.hash.slice(0, 30), '...');
            window.parent.postMessage(window.location.hash, '*');
        }
    }
}
