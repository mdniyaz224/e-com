/**
 * Converts a number to Indian Currency Words (e.g. 2499 -> "Indian Rupees Two Thousand Four Hundred Ninety-Nine Only")
 */
export function numberToWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Indian Rupees Zero Only';

  const num = Math.floor(amount);
  if (num === 0) return 'Indian Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 20) return units[n];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + units[unit] : '');
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred) str += units[hundred] + ' Hundred';
    if (rest) str += (str ? ' and ' : '') + convertTwoDigits(rest);
    return str;
  }

  let crore = Math.floor(num / 10000000);
  let lakh = Math.floor((num % 10000000) / 100000);
  let thousand = Math.floor((num % 100000) / 1000);
  let remainder = num % 1000;

  let result = '';

  if (crore) {
    result += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh) {
    result += convertThreeDigits(lakh) + ' Lakh ';
  }
  if (thousand) {
    result += convertThreeDigits(thousand) + ' Thousand ';
  }
  if (remainder) {
    result += convertThreeDigits(remainder);
  }

  return `Indian Rupees ${result.trim()} Only`;
}

