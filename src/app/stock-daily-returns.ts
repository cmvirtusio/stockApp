export class StockDailyReturns {
    ticker : string;
    dailyReturns : DailyReturn[];

    constructor(ticker: string, aVresponse : any){
        this.ticker = ticker;
        this.dailyReturns = Object.keys(aVresponse["Time Series (Daily)"])
        .map(key=>{
            return new DailyReturn(key, aVresponse["Time Series (Daily)"][key]['4. close']);
        })
    }
}

class DailyReturn{
    date : string;
    price : number;

    constructor(date, price){
        this.date = date;
        this.price = price;
    }
}