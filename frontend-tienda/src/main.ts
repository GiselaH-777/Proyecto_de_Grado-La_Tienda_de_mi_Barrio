import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <--- Esto debe apuntar a tu archivo app.ts

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));