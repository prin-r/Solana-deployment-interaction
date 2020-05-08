/**
 * PriceDB
 *
 * @flow
 */

import {
  establishConnection,
  establishPayer,
  loadProgram,
  setPrice,
  setValidator,
  verifyAndSetPrice,
} from './pricedb';

async function main() {
  console.log('Begin interaction with PriceDB program on solana');

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayer();

  // Load the program if not already loaded
  await loadProgram();

  // setPrice to the price keeper account
  // await setPrice();

  // setValidator to the validator keeper account
  // await setValidator();

  // verifyAndSetPrice
  // await verifyAndSetPrice();

  console.log('Success');
}

main()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
