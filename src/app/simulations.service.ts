import { Injectable } from '@angular/core';
import * as gaussian from 'gaussian';
import * as stats from 'stats-lite';

@Injectable({
  providedIn: 'root'
})
export class SimulationsService {

  constructor() { }
  matrixTransposer(matrix) {
    return matrix[0].map((x, i) => matrix.map(y => y[i]));
  }
  getPercentilesFromSimulations(arrayOfSimulations) {
    return {
      percentile10: stats.percentile(arrayOfSimulations, 10 / 100),
      percentile30: stats.percentile(arrayOfSimulations, 30 / 100),
      percentile50: stats.percentile(arrayOfSimulations, 50 / 100),
      percentile70: stats.percentile(arrayOfSimulations, 70 / 100),
      percentile90: stats.percentile(arrayOfSimulations, 90 / 100),
    }
  }
  getPercentileArray(percentTileSimulations, percentileKey) {
    return percentTileSimulations.map(percentileObj => {
      return percentileObj[percentileKey];
    });
  }
  getPercentileEOYNW(eoyNetworths) {
    const percentileDynamicSims = eoyNetworths.map(currentYearArray => {
      return this.getPercentilesFromSimulations(currentYearArray);
    });
    return {
      percenttile10th: this.getPercentileArray(percentileDynamicSims, 'percentile10'),
      percenttile30th: this.getPercentileArray(percentileDynamicSims, 'percentile30'),
      percenttile50th: this.getPercentileArray(percentileDynamicSims, 'percentile50'),
      percenttile70th: this.getPercentileArray(percentileDynamicSims, 'percentile70'),
      percenttile90th: this.getPercentileArray(percentileDynamicSims, 'percentile90')
    }
  }
  homogeneousDPS(numberOfSimulations, cashFlowData, arrayOfPortfolios, retirementTarget) {

    function convertNormalToLogNormal(normDist) {
      const variance = Math.pow(normDist.sd, 2);
      return {
        m: Math.log(normDist.m / Math.sqrt(1 + (variance / Math.pow(normDist.m, 2)))),
        sd: Math.sqrt(Math.log(1 + (variance / Math.pow(normDist.m, 2))))
      }
    }
    function getnthPercentile(cfData, logNormalDistribution, nthPercentile = 10) {
      const zScore = gaussian(0, 1).ppf(nthPercentile / 100);
      const totalLength = cfData.length;
      let result = 0;
      for (let i = 0; i < totalLength; i++) {
        const numberOfYearsToGrow = (totalLength - i);
        const SD = Math.sqrt(Math.pow(logNormalDistribution.sd, 2) * numberOfYearsToGrow);
        const MEAN = (logNormalDistribution.m * numberOfYearsToGrow);
        result = result + cfData[i] * Math.pow(Math.E, MEAN + (SD * (zScore)));
      }
      return result;
    }
    function getLeastRiskyPortfolioThatHitsTarget(currentNetWorth, cashFlowData, arrayOfPortfolios, retirementTarget) {
      // assume arrayOfPortfolios is sorted from leastRisky to mostRisky
      let canRetire = false;
      let portfolioIndex = 0;
      let randomNormalDistribution = arrayOfPortfolios[portfolioIndex];
      const curCF = [currentNetWorth].concat(cashFlowData);

      while (!canRetire) {
        const logNormalDistribution = convertNormalToLogNormal(randomNormalDistribution);
        const percentile10th = getnthPercentile(curCF, logNormalDistribution, 10);
        if (percentile10th < retirementTarget) {
          portfolioIndex++;
          if (portfolioIndex === arrayOfPortfolios.length) {
            canRetire = true;
          } else {
            randomNormalDistribution = arrayOfPortfolios[portfolioIndex];
          }
        } else {
          canRetire = true;
        }
      }
      return randomNormalDistribution;
    }
    const portfoliosArray = arrayOfPortfolios.map(portfolios => {
      return {
        m: portfolios.m + 1,
        sd: portfolios.sd,
        name: portfolios.name
      }
    });

    const homogeneousDPSresults = Array(numberOfSimulations).fill(null).map(() => {
      let currentNetworth = 0;
      const eoyNetWorth = [];
      const eoyPortfolio = [];

      for (let i = 0; i < cashFlowData.length; i++) {
        currentNetworth = (currentNetworth + cashFlowData[i]);
        const randomNormalDistribution = getLeastRiskyPortfolioThatHitsTarget(currentNetworth, cashFlowData.slice(i + 1), portfoliosArray, retirementTarget);
        const gsDistribution = gaussian(randomNormalDistribution.m, randomNormalDistribution.sd * randomNormalDistribution.sd);
        currentNetworth = currentNetworth * gsDistribution.ppf(Math.random());
        eoyNetWorth.push(currentNetworth);
        eoyPortfolio.push(randomNormalDistribution.name);
      }

      return {
        eoyNetWorth: eoyNetWorth,
        eoyPortfolio: eoyPortfolio
      }
    });

    const homogeneousDPSeoyNetworths = this.matrixTransposer(homogeneousDPSresults.map(simulation => simulation.eoyNetWorth));
    const percentileEOYNW = this.getPercentileEOYNW(homogeneousDPSeoyNetworths);
    function getDistributionOfPortfolios(currentYearPortfolios, arrOfPortfolios, numberOfSimulations) {
      const keys = arrOfPortfolios.map(portfolio => portfolio.name);
      let distinctDistributionOfPortfolios = {};
      keys.forEach(key => {
        distinctDistributionOfPortfolios[key] = (currentYearPortfolios.filter(port => (port === key)).length / numberOfSimulations * 100).toFixed(2);
      });
      return distinctDistributionOfPortfolios;
    }
    const homogeneousDPSeoyPortfolios = this.matrixTransposer(homogeneousDPSresults.map(simulation => simulation.eoyPortfolio));
    const portfolioDistributionPerYear = homogeneousDPSeoyPortfolios.map(currentYearPortfolios => {
      return getDistributionOfPortfolios(currentYearPortfolios, arrayOfPortfolios, numberOfSimulations);
    });
    return {
      percentileEndOfYearNetWorth: percentileEOYNW,
      endOfYearPortfolioDistribution: portfolioDistributionPerYear,
      oddsOfHittingTarget: ((homogeneousDPSeoyNetworths[homogeneousDPSeoyNetworths.length - 1].filter(eoyNW => (eoyNW > retirementTarget))).length) / numberOfSimulations
    }
  }

  staticPortfolioSolution(numberOfSimulations, cashFlowData, arrayOfPortfolios, retirementTarget) {
    const randomNormalDistribution = {
      m: arrayOfPortfolios[0].m + 1,
      sd: arrayOfPortfolios[0].sd
    };

    const sps = Array(numberOfSimulations).fill(null).map(() => {
      let currentNetworth = 0;
      const eoyNetWorth = [];
      for (let i = 0; i < cashFlowData.length; i++) {
        const gsDistribution = gaussian(randomNormalDistribution.m, randomNormalDistribution.sd * randomNormalDistribution.sd);
        currentNetworth = (currentNetworth + cashFlowData[i]) * gsDistribution.ppf(Math.random());
        eoyNetWorth.push(currentNetworth);
      }
      return eoyNetWorth;
    });

    const staticSPSeoyNetworths = this.matrixTransposer(sps);
    const percentileEOYNW = this.getPercentileEOYNW(staticSPSeoyNetworths);

    return {
      percentileEndOfYearNetWorth: percentileEOYNW,
      oddsOfHittingTarget: ((staticSPSeoyNetworths[staticSPSeoyNetworths.length - 1].filter(eoyNW => (eoyNW > retirementTarget))).length) / numberOfSimulations
    }
  }
}
