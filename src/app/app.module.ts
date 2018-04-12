import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

//This Enables http calls;
import { HttpClientModule } from '@angular/common/http';
import { AlphavantageService } from './alphavantage.service';
//enable twowaybinding
import { FormsModule } from '@angular/forms';



import { AppComponent } from './app.component';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [AlphavantageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
