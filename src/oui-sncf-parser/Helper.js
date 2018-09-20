function moneyStrToValue(stringMoney) {
  let tmpString = stringMoney.slice(0, -2);
  tmpString = tmpString.replace(/,/g, '.');
  return Number(tmpString);
}

function dateStrToIso(stringDate, currentYear) {
  const tmpDate = stringDate.split(' ');

  const date = new Date(`${tmpDate[1]} ${tmpDate[2]} ${currentYear} 00:00:00 UTC`).toISOString();

  return date.replace('T', ' ');
}

function timeWithDoubleDot(stringTime) {
  return stringTime.replace('h', ':');
}

export { moneyStrToValue, dateStrToIso, timeWithDoubleDot };
