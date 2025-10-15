#!/usr/bin/env node

/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running BigNumber Icon Feature Tests...\n');

const testFiles = [
  'BigNumberIcon.test.tsx',
  'IconValidation.test.ts',
  'TransformProps.test.ts',
  'IconIntegration.test.tsx',
  'ControlPanel.test.ts'
];

const testDir = __dirname;
const projectRoot = path.join(__dirname, '../../../../..');

let allTestsPassed = true;
let totalTests = 0;
let passedTests = 0;

console.log('📋 Test Files to Run:');
testFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${file}`);
});
console.log('');

for (const testFile of testFiles) {
  const testPath = path.join(testDir, testFile);
  console.log(`\n🔍 Running ${testFile}...`);
  
  try {
    const result = execSync(
      `cd "${projectRoot}" && npm test -- --testPathPattern="${testPath}" --verbose --no-coverage`,
      { 
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );
    
    console.log(`✅ ${testFile} - PASSED`);
    passedTests++;
    
    // Extract test count from output
    const testMatch = result.match(/(\d+) tests?/);
    if (testMatch) {
      totalTests += parseInt(testMatch[1]);
    }
    
  } catch (error) {
    console.log(`❌ ${testFile} - FAILED`);
    console.log(error.stdout || error.message);
    allTestsPassed = false;
  }
}

console.log('\n📊 Test Summary:');
console.log(`  Total Tests: ${totalTests}`);
console.log(`  Passed: ${passedTests}`);
console.log(`  Failed: ${testFiles.length - passedTests}`);
console.log(`  Success Rate: ${Math.round((passedTests / testFiles.length) * 100)}%`);

if (allTestsPassed) {
  console.log('\n🎉 All tests passed! Icon feature is working correctly.');
  process.exit(0);
} else {
  console.log('\n💥 Some tests failed. Please check the output above.');
  process.exit(1);
}
