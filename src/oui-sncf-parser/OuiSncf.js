import fs from 'fs';
import jsdom from 'jsdom';
import URL from 'url-parse';

import { moneyStrToValue, dateStrToIso, timeWithDoubleDot } from './Helper';

const { JSDOM } = jsdom;

class OuiSncf {
  constructor(fileAbsPath, isUgly = false) {
    let fileStringify = fs.readFileSync(fileAbsPath, { encoding: 'utf8' });

    if (isUgly) {
      // clean carriage return newline and strip slashes
      fileStringify = fileStringify.replace(/\\r?\\n|\r/g, ' ');
      fileStringify = fileStringify.replace(/\\(.?)/g, ' ');
    }

    const dom = new JSDOM(fileStringify);
    this.document = dom.window.document;
  }

  getResult() {
    this.setCode();
    this.setName();
    this.setMainPrice();
    this.setCustomPrice();
    this.setRoundTrip();

    return {
      trips: [{
        code: this.code,
        name: this.name,
        details: {
          price: this.mainPrice,
          roundTrips: this.roundTrip,
        },
      }],
      custom: {
        prices: this.customPrices,
      },
    };
  }

  setName() {
    // has ownerName and pnrRef information
    const primaryLink = this.document.querySelector('a.primary-link').href;
    const urlInfo = new URL(primaryLink, true);

    this.name = urlInfo.query.ownerName;

    if (this.name === undefined) {
      throw Error('Could not fetch name');
    }
  }

  setCode() {
    const blockTravel = this.document.getElementById('block-travel');

    this.code = blockTravel.querySelector('tbody tr td > table.block-pnr span.pnr-info').textContent.trim();

    if (this.code === undefined) {
      throw Error('Could not fetch code');
    }
  }

  setMainPrice() {
    const blockPayment = this.document.getElementById('block-payment');
    const rawMainPrice = blockPayment.querySelector('td.very-important').textContent.trim();

    this.mainPrice = moneyStrToValue(rawMainPrice);

    if (this.mainPrice === undefined) {
      throw Error('Could not fetch main price');
    }
  }

  setCustomPrice() {
    const customPrices = [];
    const blockCommand = this.document.getElementById('block-command');
    const rawProductHeaders = blockCommand.querySelectorAll('td.digital-box-cell > table.product-header');

    for (const rawProductHeader of rawProductHeaders) {
      const rawCustomPrice = rawProductHeader.querySelector('tbody tr td:last-child').lastChild.textContent.trim();
      customPrices.push({
        value: moneyStrToValue(rawCustomPrice),
      });
    }

    const rawCardAmounts = this.document.getElementById('cards').querySelectorAll('td.amount');
    for (let rawCardAmount of rawCardAmounts) {
      rawCardAmount = rawCardAmount.textContent.trim();
      customPrices.push({
        value: moneyStrToValue(rawCardAmount),
      });
    }

    this.customPrices = customPrices;

    if (this.customPrices === undefined) {
      throw Error('Could not fetch custom price');
    }
  }

  setRoundTrip() {
    const roundTrip = [];

    // get tickets information
    const blockCommand = this.document.getElementById('block-command');
    const rawTrips = blockCommand.querySelectorAll('td.digital-box-cell > table.product-details');

    // get current year
    const blockPayment = this.document.getElementById('block-payment');
    const paymentDate = blockPayment.querySelector('table.transaction-details tbody tr:nth-child(3) td:nth-child(2)');
    const currentYear = paymentDate.textContent.trim().slice(0, -17).split(' ')[2];

    for (const rawTrip of rawTrips) {
      const trains = [];
      const date = rawTrip.previousElementSibling.textContent.trim();
      let departure = Array.from(rawTrip.querySelectorAll('tr:first-child > td'));
      let arrival = Array.from(rawTrip.querySelectorAll('tr:last-child > td'));

      departure = departure.map(elem => elem.textContent.trim());
      arrival = arrival.map(elem => elem.textContent.trim());

      trains.push({
        departureTime: timeWithDoubleDot(departure[1]),
        departureStation: departure[2],
        arrivalTime: timeWithDoubleDot(arrival[0]),
        arrivalStation: arrival[1],
        type: departure[3],
        number: departure[4],
      });

      const trip = {
        type: departure[0],
        date: dateStrToIso(date, currentYear),
        trains,
      };
      roundTrip.push(trip);
    }

    // adding passagers, should perhaps not be save here
    const passengers = [];
    const rawPassengers = rawTrips[0].nextElementSibling.querySelectorAll('td.typology');
    for (const passenger of rawPassengers) {
      passengers.push({
        type: 'échangeable',
        age: passenger.lastChild.textContent.trim(),
      });
    }
    roundTrip[roundTrip.length - 1].trains[0].passengers = passengers;

    this.roundTrip = roundTrip;

    if (this.roundTrip === undefined) {
      throw Error('Could not fetch roundTrip');
    }
  }
}

export default OuiSncf;
