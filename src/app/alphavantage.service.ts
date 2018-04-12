import { Injectable } from '@angular/core';
//Imported so that I can pull
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/map';


@Injectable()
export class AlphavantageService {
  //inject dependency
  //add httpclient
  constructor(private _http:HttpClient) { }
  
  dailyReturns(ticker:string){
    return this._http.get("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol="+ ticker +"&apikey=L1TV17SLEIT0P4ZT");
  }

}
