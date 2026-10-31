/**
 * Master Unit Test Runner for PulseKart E-Commerce
 * Runs all unit test suites and outputs a clear summary report.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDir = path.resolve(__dirname, 'unit');
const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));

console.log('\n======================================================');
console.log('       PULSEKART E-COMMERCE UNIT TEST SUITE           ');
console.log('======================================================');
console.log(`Discovered ${testFiles.length} test suites in tests/unit/\n`);

async function runTestSuite(file) {
  const filePath = path.join(testDir, file);
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(process.execPath, ['--test', filePath], {
      stdio: 'pipe',
      env: process.env
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { errorOutput += d.toString(); });

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const passed = code === 0;

      // Extract pass/fail counts from node:test output
      const passMatch = output.match(/pass (\d+)/i) || output.match(/✔ (\d+)/);
      const failMatch = output.match(/fail (\d+)/i) || output.match(/✖ (\d+)/);
      const passCount = passMatch ? parseInt(passMatch[1]) : 0;
      const failCount = failMatch ? parseInt(failMatch[1]) : 0;

      resolve({
        file,
        passed,
        duration,
        passCount,
        failCount,
        output,
        errorOutput
      });
    });
  });
}

async function runAll() {
  const overallStart = Date.now();
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const file of testFiles) {
    process.stdout.write(`▶ Running ${file.padEnd(35)} `);
    const res = await runTestSuite(file);
    results.push(res);

    if (res.passed) {
      console.log(`\x1b[32m✔ PASSED\x1b[0m (${res.duration}s)`);
      totalPassed += 1;
    } else {
      console.log(`\x1b[31m✖ FAILED\x1b[0m (${res.duration}s)`);
      totalFailed += 1;
      if (res.output) console.log(res.output);
      if (res.errorOutput) console.error(res.errorOutput);
    }
  }

  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

  console.log('\n======================================================');
  console.log('                  TEST SUMMARY REPORT                 ');
  console.log('======================================================');
  console.log(`Total Test Suites : ${testFiles.length}`);
  console.log(`Suites Passed     : \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`Suites Failed     : ${totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : '0'}`);
  console.log(`Total Duration    : ${overallDuration}s`);
  console.log('======================================================');

  if (totalFailed === 0) {
    console.log('\x1b[32m✔ 100% PERFECT! ALL UNIT TESTS PASSED SUCCESSFULLY.\x1b[0m\n');
    process.exit(0);
  } else {
    console.log('\x1b[31m✖ SOME TESTS FAILED. PLEASE REVIEW LOGS ABOVE.\x1b[0m\n');
    process.exit(1);
  }
}

runAll();

