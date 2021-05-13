/**
 * Std Reference Basic
 */

import {
  establishConnection,
  establishPayer,
  loadProgram,
  initStdBasic,
  transferOwnership,
  relayPrices,
  setPrice,
  removePrices,
  reportHellos,
} from './std_basic';

const sleep = async (ms: any) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('Start script...');

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Load the program if not already loaded
  await loadProgram();

  // // sleep 5 secs
  // await sleep(5000);

  // // init std basic account
  // await initStdBasic();

  // return;

  // set owner
  // await transferOwnership();

  // return;

  // await relayPrices();

  // return;

  await setPrice();

  return;

  // Find out how many times that account has been greeted
  await reportHellos();

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
