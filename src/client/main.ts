/**
 * Std Reference Basic
 */

import {
  establishConnection,
  establishPayer,
  loadProgram,
  initStdBasic,
  setOwner,
  setPrices,
  reportHellos,
} from "./std_basic";

async function main() {
  console.log("Start script...");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Load the program if not already loaded
  // await loadProgram();

  // init std basic account

  // await initStdBasic();

  // await setOwner();

  await setPrices();

  // Find out how many times that account has been greeted
  await reportHellos();

  console.log('Success');
}

main().then(
  () => process.exit(),
  (err) => {
    console.error(err);
    process.exit(-1);
  }
);
