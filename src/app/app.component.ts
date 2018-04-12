import { Component,OnInit } from '@angular/core';
import { AlphavantageService } from './alphavantage.service';
import { Chart } from 'chart.js';
import { StockDailyReturns } from './stock-daily-returns';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  ticker : string = "SPY";
  sdr : StockDailyReturns;
  chart = []; // This will hold our chart info
  buttonToggle : boolean = true;
  watchList : string[] = ["SPY", "TLT", "GLD"];

  constructor(private _aVS: AlphavantageService) {}

  ngOnInit() {
    this.getValues();
  }
  getValues(){
    this.ticker = this.ticker.toUpperCase();
    if(this.buttonToggle){
      this.buttonToggle = false;
      this._aVS.dailyReturns(this.ticker).subscribe(
        //success
        res => {
          try{
            this.sdr = new StockDailyReturns(this.ticker,res);
            this.chartsdr();
            this.buttonToggle = true;
            this.addstock(this.ticker);


          } catch(error) {
            this.buttonToggle = true;
            alert("ticker not valid");
          }
        }
      )
    }
  }
  addstock(string){
    var index = this.watchList.indexOf(string, 0);
    if (index > -1) {
      //this.watchList.splice(index, 1);
    } else {
      this.watchList.push(string);
    }
  }

  removestock(string){
    var index = this.watchList.indexOf(string, 0);
    if (index > -1) {
      this.watchList.splice(index, 1);
    }
  }
  getValuesFromWL(ticker){
    this.ticker = ticker;
    this.getValues();
  }

  chartsdr(){
    let dates = this.sdr.dailyReturns.map(daily=>daily.date).reverse();
    let prices = this.sdr.dailyReturns.map(daily=>daily.price).reverse();
    this.chart = new Chart('canvas', {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          { 
            data: prices,
            borderColor: "#3cba9f",
            backgroundColor: '#ffffff',
            fill: false
          },
        ]
      },
      options: {
        layout: {
          padding: {
              left: 20,
              right: 20,
              top: 20,
              bottom: 20
            }
        },
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: true
          }],
          yAxes: [{
            display: true
          }],
        }
      }
    });
    
  }

}
