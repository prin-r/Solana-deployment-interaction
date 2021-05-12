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
const fs = require('mz/fs');

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
const numPrices = 50;
const stdBasicAccountDataLayout = BufferLayout.struct(
  [
    BufferLayout.blob(32, 'owner'),
    BufferLayout.blob(1, 'current_size'),
    BufferLayout.blob(4, 'len'),
    Array(numPrices)
      .fill(['symbol', 'px', 'last_updated', 'request_id'])
      .map((e: Array<string>, i) =>
        e.map((ee: string) => BufferLayout.blob(8, ee + (i + 1))),
      ),
  ]
    .reduce((acc, val) => acc.concat(val), [])
    .flat(),
);

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
      console.log('establishPayer: config not found');
    }

    // Fund a new payer via airdrop
    if (!payerSecretKey) {
      payerAccount = await newAccountWithLamports(connection, fees);
      console.log('establishPayer create new payer ' + payerAccount.publicKey);
    } else {
      payerAccount = new Account(Buffer.from(payerSecretKey, 'hex'));
      console.log('establishPayer with payer ' + payerAccount.publicKey);
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
    console.log('std pubkey', stdPubkey);
    console.log('Program already loaded to account', programId.toBase58());

    const amount = 1_000_000_000; // 1 sol
    const signature = await connection.requestAirdrop(
      payerAccount.publicKey,
      amount,
    );
    await connection.confirmTransaction(signature, 'singleGossip');
    console.log('Fund 1 Sol -> ', payerAccount.publicKey.toString());

    return;
  } catch (err) {
    // try to load the program
    console.log('error while loading program', err);
  }

  console.log('stdBasicAccountDataLayout.span', stdBasicAccountDataLayout.span);

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
  console.log(
    'Creating account',
    stdPubkey.toBase58(),
    'to say std reference basic to',
  );
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
  console.log('stdBasicAccountDataLayout.span', stdBasicAccountDataLayout.span);
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
    url,
    programId: programId.toBase58(),
    stdPubkey: stdPubkey.toBase58(),
    payerSecretKey: Buffer.from(payerAccount.secretKey).toString('hex'),
  });
}

/**
 * Init std basic
 */
export async function initStdBasic(): Promise<void> {
  console.log('init std basic account to', stdPubkey.toBase58());
  console.log('>>>>>', payerAccount.publicKey.toBuffer().toString('hex'));
  const instruction = new TransactionInstruction({
    keys: [{pubkey: stdPubkey, isSigner: false, isWritable: true}],
    programId,
    data: Buffer.from(
      '00' + '32' + payerAccount.publicKey.toBuffer().toString('hex'),
      'hex',
    ), // All instructions are hellos
  });
  console.log('instruction:', instruction);
  try {
    // const xx = await connection.simulateTransaction(
    //   new Transaction().add(instruction),
    //   [payerAccount],
    // );

    // console.log(xx['value']['err']);

    // return;

    const txResult = await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payerAccount],
      {
        commitment: 'singleGossip',
        preflightCommitment: 'singleGossip',
      },
    );
    console.log(txResult);
  } catch (e) {
    console.log(e);
  }
}

/**
 * Set Owner
 */
export async function transferOwnership(): Promise<void> {
  console.log(
    'set the owner of std basic account to',
    payerAccount.publicKey.toBase58(),
  );
  console.log('>>>>>>>', payerAccount.publicKey.toBuffer().toString('hex'));
  console.log('------>', stdPubkey.toBuffer().toString('hex'));
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
      {pubkey: payerAccount.publicKey, isSigner: true, isWritable: true},
    ],
    programId,
    data: Buffer.from(
      '01' + 'fa3dcdc78fb119eab365b643b5154b6567c7cbab6b71d181010758f6b59b0e8f', // payerAccount.publicKey.toBuffer().toString('hex'),
      'hex',
    ), // All instructions are hellos
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
export async function relayPrices(): Promise<void> {
  try {
    const store = new Store();
    const config = await store.load('config.json');
    programId = new PublicKey(config.programId);
    stdPubkey = new PublicKey(config.stdPubkey);
    await connection.getAccountInfo(programId);
    console.log('Program already loaded to account', programId.toBase58());
  } catch (e) {
    console.log('fail to load config');
  }

  console.log('relay prices for std basic');
  console.log('>>>>>>>', payerAccount.publicKey.toBuffer().toString('hex'));
  console.log('------>', stdPubkey.toBuffer().toString('hex'));
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
      {pubkey: payerAccount.publicKey, isSigner: true, isWritable: true},
    ],
    programId,
    data: Buffer.from(
      '020b00000042323000000000000100000000000000010000000000000001000000000000004232330000000000010000000000000001000000000000000100000000000000423231000000000001000000000000000100000000000000010000000000000042313800000000000100000000000000010000000000000001000000000000004232320000000000010000000000000001000000000000000100000000000000423139000000000001000000000000000100000000000000010000000000000042323500000000000100000000000000010000000000000001000000000000004231350000000000010000000000000001000000000000000100000000000000423136000000000001000000000000000100000000000000010000000000000042313700000000000100000000000000010000000000000001000000000000004232340000000000010000000000000001000000000000000100000000000000',
      'hex',
    ), // All instructions are hellos
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
 * Remove Prices
 */
export async function removePrices(): Promise<void> {
  try {
    const store = new Store();
    const config = await store.load('config.json');
    programId = new PublicKey(config.programId);
    stdPubkey = new PublicKey(config.stdPubkey);
    await connection.getAccountInfo(programId);
    console.log('Program already loaded to account', programId.toBase58());
  } catch (e) {
    console.log('fail to load config');
  }

  console.log('remove prices for std basic');
  console.log('>>>>>>>', payerAccount.publicKey.toBuffer().toString('hex'));
  console.log('------>', stdPubkey.toBuffer().toString('hex'));
  const instruction = new TransactionInstruction({
    keys: [
      {pubkey: stdPubkey, isSigner: false, isWritable: true},
      {pubkey: payerAccount.publicKey, isSigner: true, isWritable: true},
    ],
    programId,
    data: Buffer.from(
      '0333000000423530000000000042343900000000004234380000000000423437000000000042343600000000004234350000000000423434000000000042343300000000004234320000000000423431000000000042343000000000004233390000000000423338000000000042333700000000004233360000000000423335000000000042333400000000004233330000000000423332000000000042333100000000004233300000000000423239000000000042323800000000004232370000000000423236000000000042323500000000004232340000000000423233000000000042323200000000004232310000000000423230000000000042313900000000004231380000000000423137000000000042313600000000004231350000000000423134000000000042313300000000004231320000000000423131000000000042313000000000004239000000000000423800000000000042370000000000004236000000000000423500000000000042340000000000004233000000000000423200000000000042310000000000004230000000000000',
      'hex',
    ), // All instructions are hellos
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
  console.log(stdPubkey.toBase58(), 'has been greeted', info, 'times');
}
