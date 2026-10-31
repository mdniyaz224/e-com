const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Helper to load ES module utility functions in CommonJS test runner
function loadUtil(relativePath) {
  const fullPath = path.resolve(__dirname, '../../', relativePath);
  const code = fs.readFileSync(fullPath, 'utf-8')
    .replace(/export function /g, 'function ')
    .replace(/export default /g, 'const defaultExport = ');
  return new Function(`${code}; return { formatPrice: typeof formatPrice !== 'undefined' ? formatPrice : undefined, formatNumber: typeof formatNumber !== 'undefined' ? formatNumber : undefined, numberToWords: typeof numberToWords !== 'undefined' ? numberToWords : undefined };`)();
}

const { formatPrice, formatNumber } = loadUtil('src/utils/formatPrice.js');
const { numberToWords } = loadUtil('src/utils/numberToWords.js');

describe('Utils: formatPrice() & formatNumber()', () => {
  it('should format standard prices with the Indian Rupee symbol', () => {
    const formatted = formatPrice(2499);
    assert.match(formatted, /₹/);
    assert.match(formatted, /2,499/);
  });

  it('should format zero correctly', () => {
    const formatted = formatPrice(0);
    assert.match(formatted, /₹/);
    assert.match(formatted, /0/);
  });

  it('should format large amounts with Indian comma grouping', () => {
    const formatted = formatPrice(125000);
    assert.match(formatted, /₹/);
    assert.match(formatted, /1,25,000/);
  });

  it('should round decimal prices to integers without fraction digits', () => {
    const formatted = formatPrice(499.75);
    assert.match(formatted, /500/);
  });

  it('should format numbers >= 1000 with Indian grouping in formatNumber()', () => {
    assert.strictEqual(formatNumber(1500), '1,500');
    assert.strictEqual(formatNumber(125000), '1,25,000');
  });

  it('should return numbers < 1000 as string without commas in formatNumber()', () => {
    assert.strictEqual(formatNumber(450), '450');
    assert.strictEqual(formatNumber(99), '99');
    assert.strictEqual(formatNumber(0), '0');
  });
});

describe('Utils: numberToWords() - Flipkart Tax Invoice Format', () => {
  it('should return "Indian Rupees Zero Only" for 0, null, or undefined', () => {
    assert.strictEqual(numberToWords(0), 'Indian Rupees Zero Only');
    assert.strictEqual(numberToWords(null), 'Indian Rupees Zero Only');
    assert.strictEqual(numberToWords(undefined), 'Indian Rupees Zero Only');
    assert.strictEqual(numberToWords(NaN), 'Indian Rupees Zero Only');
  });

  it('should convert single digit amounts', () => {
    assert.strictEqual(numberToWords(5), 'Indian Rupees Five Only');
    assert.strictEqual(numberToWords(9), 'Indian Rupees Nine Only');
  });

  it('should convert teens and tens', () => {
    assert.strictEqual(numberToWords(17), 'Indian Rupees Seventeen Only');
    assert.strictEqual(numberToWords(50), 'Indian Rupees Fifty Only');
    assert.strictEqual(numberToWords(42), 'Indian Rupees Forty Two Only');
  });

  it('should convert hundreds', () => {
    assert.strictEqual(numberToWords(100), 'Indian Rupees One Hundred Only');
    assert.strictEqual(numberToWords(350), 'Indian Rupees Three Hundred and Fifty Only');
    assert.strictEqual(numberToWords(999), 'Indian Rupees Nine Hundred and Ninety Nine Only');
  });

  it('should convert thousands and compound invoice amounts', () => {
    assert.strictEqual(numberToWords(2499), 'Indian Rupees Two Thousand Four Hundred and Ninety Nine Only');
    assert.strictEqual(numberToWords(5047), 'Indian Rupees Five Thousand Forty Seven Only');
  });

  it('should convert Lakhs and Crores', () => {
    assert.strictEqual(numberToWords(150000), 'Indian Rupees One Lakh Fifty Thousand Only');
    assert.strictEqual(numberToWords(25000000), 'Indian Rupees Two Crore Fifty Lakh Only');
  });
});

