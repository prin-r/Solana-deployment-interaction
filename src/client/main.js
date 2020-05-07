/**
 * Hello world
 *
 * @flow
 */

import {
  establishConnection,
  establishPayer,
  loadProgram,
  setValidator,
  verifyAndSetPrice,
} from './hello_world';

async function main() {
  console.log("Let's say hello to a Solana account...");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Load the program if not already loaded
  await loadProgram();

  // setValidator to an account
  // await setValidator();

  // verifyAndSetPrice
  await verifyAndSetPrice();

  console.log('Success');
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
