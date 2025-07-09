import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    AppComponent,
    CookieConsentComponent,
    PrivacyPolicyComponent
    // ...existing components...
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule
    // ...existing imports...
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }