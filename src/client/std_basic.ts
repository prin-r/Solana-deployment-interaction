/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  Account,
  Connection,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'mz/fs';

// @ts-ignore
import BufferLayout from 'buffer-layout';

import {url, urlTls} from './util/url';
import {Store} from './util/store';
import {newAccountWithLamports} from './util/new-account-with-lamports';


/**
 * Connection to the network
 */
let connection: Connection;

/**
 * Connection to the network
 */
let payerAccount: Account;

/**
 * Hello world's program id
 */
let programId: PublicKey;

/**
 * The public key of the account we are saying hello to
 */
let stdPubkey: PublicKey;

const pathToProgram = 'dist/program/solana_bpf_std_ref_basic.so';

/**
 * Layout of the std basic account data
 */
const stdBasicAccountDataLayout = BufferLayout.struct([
  BufferLayout.blob(32, 'owner'),
  BufferLayout.blob(4, 'len'),
  BufferLayout.blob(8, 'symbol1'),
  BufferLayout.blob(8, 'px1'),
  BufferLayout.blob(8, 'last_updated1'),
  BufferLayout.blob(8, 'request_id1'),
  BufferLayout.blob(8, 'symbol2'),
  BufferLayout.blob(8, 'px2'),
  BufferLayout.blob(8, 'last_updated2'),
  BufferLayout.blob(8, 'request_id2'),
  BufferLayout.blob(8, 'symbol3'),
  BufferLayout.blob(8, 'px3'),
  BufferLayout.blob(8, 'last_updated3'),
  BufferLayout.blob(8, 'request_id3'),
  BufferLayout.blob(8, 'symbol4'),
  BufferLayout.blob(8, 'px4'),
  BufferLayout.blob(8, 'last_updated4'),
  BufferLayout.blob(8, 'request_id4'),
  BufferLayout.blob(8, 'symbol5'),
  BufferLayout.blob(8, 'px5'),
  BufferLayout.blob(8, 'last_updated5'),
  BufferLayout.blob(8, 'request_id5'),
  BufferLayout.blob(8, 'symbol6'),
  BufferLayout.blob(8, 'px6'),
  BufferLayout.blob(8, 'last_updated6'),
  BufferLayout.blob(8, 'request_id6'),
  BufferLayout.blob(8, 'symbol7'),
  BufferLayout.blob(8, 'px7'),
  BufferLayout.blob(8, 'last_updated7'),
  BufferLayout.blob(8, 'request_id7'),
  BufferLayout.blob(8, 'symbol8'),
  BufferLayout.blob(8, 'px8'),
  BufferLayout.blob(8, 'last_updated8'),
  BufferLayout.blob(8, 'request_id8'),
  BufferLayout.blob(8, 'symbol9'),
  BufferLayout.blob(8, 'px9'),
  BufferLayout.blob(8, 'last_updated9'),
  BufferLayout.blob(8, 'request_id9'),
  BufferLayout.blob(8, 'symbol10'),
  BufferLayout.blob(8, 'px10'),
  BufferLayout.blob(8, 'last_updated10'),
  BufferLayout.blob(8, 'request_id10'),
]);

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
  connection = new Connection(url, 'singleGossip');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', url, version);
}

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
  if (!payerAccount) {
    let fees = 0;
    const {feeCalculator} = await connection.getRecentBlockhash();

    // Calculate the cost to load the program
    const data = await fs.readFile(pathToProgram);
    const NUM_RETRIES = 500; // allow some number of retries
    fees +=
      feeCalculator.lamportsPerSignature *
        (BpfLoader.getMinNumSignatures(data.length) + NUM_RETRIES) +
      (await connection.getMinimumBalanceForRentExemption(data.length));

    // Calculate the cost to fund the std basic account
    fees += await connection.getMinimumBalanceForRentExemption(
      stdBasicAccountDataLayout.span,
    );

    // Calculate the cost of sending the transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    let payerSecretKey = null;
    try {
      const store = new Store();
      const tmp = await store.load('config.json');
      payerSecretKey = tmp.payerSecretKey;
    } catch (e) {
      console.log("establishPayer: config not found");
    }

    // Fund a new payer via airdrop
    if (!payerSecretKey) {
      payerAccount = await newAccountWithLamports(connection, fees);
      console.log("establishPayer create new payer " + payerAccount.publicKey);
    } else {
      payerAccount = new Account(Buffer.from(payerSecretKey, "hex"));
      console.log("establishPayer with payer " + payerAccount.publicKey);
    }
  }

  const lamports = await connection.getBalance(payerAccount.publicKey);
  console.log(
    'Using account',
    payerAccount.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'Sol to pay for fees',
  );
}

/**
 * Load the hello world BPF program if not already loaded
 */
export async function loadProgram(): Promise<void> {
  const store = new Store();

  // Check if the program has already been loaded
  try {
    const config = await store.load('config.json');
    programId = new PublicKey(config.programId);
    stdPubkey = new PublicKey(config.stdPubkey);
    await connection.getAccountInfo(programId);
    console.log('Program already loaded to account', programId.toBase58());
    return;
  } catch (err) {
    // try to load the program
    console.log("error while loading program",err);
  }

  // Load the program
  console.log('Loading std reference basic program...');
  const data = await fs.readFile(pathToProgram);
  const programAccount = new Account();
  await BpfLoader.load(
    connection,
    payerAccount,
    programAccount,
    data,
    BPF_LOADER_PROGRAM_ID,
  );
  programId = programAccount.publicKey;
  console.log('Program loaded to account', programId.toBase58());

  // Create the std basic account
  const stdBasicAccount = new Account();
  stdPubkey = stdBasicAccount.publicKey;
  console.log('Creating account', stdPubkey.toBase58(), 'to say std reference basic to');
  const space = stdBasicAccountDataLayout.span;
  const lamports = await connection.getMinimumBalanceForRentExemption(
    stdBasicAccountDataLayout.span,
  );
  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payerAccount.publicKey,
      newAccountPubkey: stdPubkey,
      lamports,
      space,
      programId,
    }),
  );
  console.log("stdBasicAccountDataLayout.span", stdBasicAccountDataLayout.span);
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [payerAccount, stdBasicAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );

  // Save this info for next time
  await store.save('config.json', {
    url: urlTls,
    programId: programId.toBase58(),
    stdPubkey: stdPubkey.toBase58(),
    payerSecretKey: Buffer.from([...payerAccount.secretKey]).toString("hex"),
  });
}

/**
 * Init std basic
 */
export async function initStdBasic(): Promise<void> {
  console.log('init std basic account to', stdPubkey.toBase58());
  console.log(">>>>>",payerAccount.publicKey.toBuffer().toString("hex"))
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
    ],
    programId,
    data: Buffer.from("00" + "0a" + payerAccount.publicKey.toBuffer().toString("hex"),"hex"), // All instructions are hellos
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );
}

/**
 * Set Owner
 */
export async function setOwner(): Promise<void> {
  console.log('set the owner of std basic account to', payerAccount.publicKey.toBase58());
  console.log(">>>>>>>",payerAccount.publicKey.toBuffer().toString("hex"));
  console.log("------>",stdPubkey.toBuffer().toString("hex"));
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
      {pubkey: payerAccount.publicKey, isSigner: true, isWritable: true}
    ],
    programId,
    data: Buffer.from("01" + payerAccount.publicKey.toBuffer().toString("hex"),"hex"), // All instructions are hellos
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );
}

/**
 * Set Prices
 */
export async function setPrices(): Promise<void> {
  try {
    const store = new Store();
    const config = await store.load('config.json');
    programId = new PublicKey(config.programId);
    stdPubkey = new PublicKey(config.stdPubkey);
    await connection.getAccountInfo(programId);
    console.log('Program already loaded to account', programId.toBase58());
  } catch (e) {
    console.log("fail to load config");
  }

  console.log('set prices for std basic');
  console.log(">>>>>>>",payerAccount.publicKey.toBuffer().toString("hex"));
  console.log("------>",stdPubkey.toBuffer().toString("hex"));
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
      {pubkey: payerAccount.publicKey, isSigner: true, isWritable: true}
    ],
    programId,
    data: Buffer.from("020200000045544800000000000400000000000000050000000000000006000000000000004254430000000000010000000000000002000000000000000300000000000000","hex"), // All instructions are hellos
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerAccount],
    {
      commitment: 'singleGossip',
      preflightCommitment: 'singleGossip',
    },
  );
}


/**
 * Report the number of times the greeted account has been said hello to
 */
export async function reportHellos(): Promise<void> {
  const accountInfo = await connection.getAccountInfo(stdPubkey);
  if (accountInfo === null) {
    throw 'Error: cannot find the greeted account';
  }
  const info = stdBasicAccountDataLayout.decode(Buffer.from(accountInfo.data));
  console.log(
    stdPubkey.toBase58(),
    'has been greeted',
    info,
    'times',
  );
}
