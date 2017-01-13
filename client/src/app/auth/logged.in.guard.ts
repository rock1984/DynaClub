import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { UserService } from './user.service';

@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private user: UserService, private router: Router) {}

  canActivate() {
      let isLoggedIn = this.user.isLoggedIn();
      if(!isLoggedIn){
          this.router.navigate(['']);
      }
      return isLoggedIn;
  }
}