import { Component } from '@angular/core';
import { SimulationsService } from './simulations.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {

  numberOfSimulations: Number;
  inflationRate: Number;
  sharpeRatio: Number;
  currentAge: number;
  retirementAge: number;
  numberOfYears: Number;
  initialInvestment: Number;
  futureCashFlow: Number;
  futureCashFlowGrowth: Number;
  retirementTarget: Number;
  riskProfile: string;

  sdCalculator: Function;
  cashFlowData: Number[];
  inflatedCashFlowData: Number[];
  inflatedRetirementTarget: Number;
  arrayOfPortfolio: any[];
  vcReturn: Number;
  cReturn: Number;
  bReturn: Number;
  gReturn: Number;
  agReturn: Number;

  simulationNumbers: any;

  oddsArray: any;
  oddsDynamic: any;
  stackedChart: any;

  constructor(
    private _simulation: SimulationsService
  ) { }

  getSDCalculator(sharpe, riskFreeRate) {
    return function (percentReturn) {
      return {
        m: 1 + percentReturn,
        sd: (percentReturn - riskFreeRate) / sharpe
      };
    }
  }
  populateCashFlowData(initialInvestment, numberOfYears, cfFuture, cfGrowth) {
    const cashFlowData = Array(numberOfYears).fill(cfFuture);
    cashFlowData.unshift(initialInvestment);
    return cashFlowData.map((cf, i) => {
      return cf * Math.pow((1 + cfGrowth), i);
    })
  }
  inflateCFData(cfData, infl) {
    return cfData.map((curCF, i) => {
      return curCF * Math.pow((1 + infl), i);
    });
  }
  createArrayOfPortfolios(sharpe, riskFreeRate, arrayOfReturns, arrayOfNames) {
    const sdCalculator = this.getSDCalculator(sharpe, riskFreeRate);
    return arrayOfReturns.map((percentReturn, i) => {
      return {
        m: percentReturn,
        sd: sdCalculator(percentReturn).sd,
        name: arrayOfNames[i]
      }
    });
  }

  runSimulation() {
    this.numberOfYears = this.retirementAge - this.currentAge;
    this.sdCalculator = this.getSDCalculator(this.sharpeRatio, this.inflationRate);
    this.cashFlowData = this.populateCashFlowData(this.initialInvestment, this.numberOfYears, this.futureCashFlow, this.futureCashFlowGrowth);
    this.inflatedCashFlowData = this.inflateCFData(this.cashFlowData, this.inflationRate);
    this.arrayOfPortfolio = [];
    const allPossiblePortfolios = this.createArrayOfPortfolios(
      this.sharpeRatio,
      this.inflationRate,
      [this.vcReturn, this.cReturn, this.bReturn, this.gReturn, this.agReturn],
      ['VC', 'C', 'B', 'G', 'AG']
    );
    for (let i = 0; i < allPossiblePortfolios.length; i++) {
      this.arrayOfPortfolio.push(allPossiblePortfolios[i]);
      if (allPossiblePortfolios[i].name === this.riskProfile) {
        break;
      }
    }

    console.log(this.arrayOfPortfolio);

    this.oddsArray = {
      VC: 0,
      C: 0,
      B: 0,
      G: 0,
      AG: 0,
    };

    ['VC', 'C', 'B', 'G', 'AG'].forEach((portfolioModel, index) => {
      const simulation = this._simulation.staticPortfolioSolution(
        this.numberOfSimulations,
        this.cashFlowData,
        allPossiblePortfolios.filter(portfolio => portfolio.name === portfolioModel),
        this.retirementTarget,
      );
      this.createPercentileLines(simulation.percentileEndOfYearNetWorth, this.currentAge, portfolioModel + 'Portfolio');
      this.oddsArray[portfolioModel] = (simulation.oddsOfHittingTarget * 100).toFixed(2) + '%';
      console.log(this.oddsArray);
    });


    this.simulationNumbers = this._simulation.homogeneousDPS(
      this.numberOfSimulations,
      this.cashFlowData,
      this.arrayOfPortfolio,
      this.retirementTarget,
    );
    this.createPercentileLines(this.simulationNumbers.percentileEndOfYearNetWorth, this.currentAge, 'DynamicPortfolio');
    this.oddsDynamic = (this.simulationNumbers.oddsOfHittingTarget * 100).toFixed(2) + '%';





    this.createStackedBarChart(this.simulationNumbers.endOfYearPortfolioDistribution, this.currentAge);
  }

  ngOnInit() {
    this.numberOfSimulations = 1000;
    this.inflationRate = 0.02;
    this.sharpeRatio = 0.7;
    this.currentAge = 30;
    this.retirementAge = 65;
    this.initialInvestment = 100000;
    this.futureCashFlow = 20000;
    this.futureCashFlowGrowth = 0;
    this.retirementTarget = 3000000;
    this.riskProfile = 'AG';
    this.vcReturn = 0.05;
    this.cReturn = 0.06;
    this.bReturn = 0.07;
    this.gReturn = 0.08;
    this.agReturn = 0.09;
    this.runSimulation();
  }

  createStackedBarChart(eoyPD, currentAge) {

    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]
    const barChartData = {
      labels: eoyPD.map((value, i) => {
        return currentAge + i;
      }),
      datasets: Object.keys(eoyPD[0]).map((key, index) => {
        return {
          label: key,
          backgroundColor: bgColourList[index],
          data: eoyPD.map(obj => {
            return obj[key];
          })
        }
      })
    };
    this.stackedChart = new Chart('stackedBars', {
      type: 'bar',
      data: barChartData,
      options: {
        title: {
          display: true,
          text: 'Distribution of Portfolio Per Year Assuming Portfolios are Homogeneous'
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            stacked: true,
          }],
          yAxes: [{
            stacked: true
          }]
        }
      }
    });

  }

  createPercentileLines(eoyNW, currentAge, chartName) {
    const bgColourList = [
      '#FFA07A',
      '#E9967A',
      '#FA8072',
      '#F08080',
      '#CD5C5C',
    ]

    const data = {
      labels: eoyNW[Object.keys(eoyNW)[0]].map((value, i) => {
        return currentAge + i;
      }),
      datasets: Object.keys(eoyNW).map((key, index) => {
        return {
          borderColor: bgColourList[index],
          data: eoyNW[key].map(numbers => {
            return numbers.toFixed();
          }),
          label: key,
          fill: '-1'
        }
      })
    };

    const options = {
      maintainAspectRatio: true,
      spanGaps: false,
      title: {
        display: true,
        text: chartName
      },
      elements: {
        line: {
          tension: 0.000001
        }
      },
      scales: {
        yAxes: [{
          stacked: false,
          type: 'linear'
        }]
      },
      plugins: {
        filler: {
          propagate: false
        },
        'samples-filler-analyser': {
          target: 'chart-analyser'
        }
      }
    };

    new Chart(chartName, {
      type: 'line',
      data: data,
      options: options,
    });

  }

}
