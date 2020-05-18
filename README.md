# Band Protocol's Solana Integration

![image](https://user-images.githubusercontent.com/12705423/82188966-e2b50380-9918-11ea-9414-7b57bdba6b5f.png)

Band Protocol is a secure, blockchain-agnostic, decentralized oracle ([more detail here](https://docs.bandprotocol.com)). It features a blockchain of its own (BandChain) that does the heavy-lifting job of pulling data from external sources, aggregating all the results, and creating a verifiable proof of data integrity to be used in other blockchain applications -- all with a secure crypto-economic guarantee for the data correctness and availability.

With Band Protocol, any developer who needs access to external data feed can query data from a number of built-in [📜 Data Oracle Scripts](http://scan-master.surge.sh/oracle-scripts). In this walkthrough we'll be working with the [📈 Crypto Price Script](http://scan-master.surge.sh/oracle-script/1).

## Getting Started

In this repository we've implemented a PoC of the integration of Band Protocol into Solana's blockchain stack. We will be walking you through a step-by-step instruction that will show you:

- ✅ How Band Protocol works
- ✅ How to select, preview, and request oracle data from BandChain
- ✅ How to implement a bridge that takes data and verifies data integrity from BandChain using band_bridge

#### ⚠️ Warning: this repository serves strictly as a PoC implementation and example guide on how to use Band Protocol oracle in Solana stack. A more complete, production ready versions of the pallets are under development and will soon be updated here.

## How Band Protocol Works with Solana

![image](https://user-images.githubusercontent.com/12705423/82143306-15a1bd80-986d-11ea-8afa-7c865d85b7ff.png)

![image](https://user-images.githubusercontent.com/12705423/82143307-1a667180-986d-11ea-9b33-649336111f3f.png)

1. The frontend of decentralized application (dApp) sends a request to BandChain and specify the Data Oracle Script it needs to make a query to.
2. The Data Oracle Script contains information that BandChain validator nodes needs to fetch the data, such as data sources, aggregation method, and the cost associated with the query
3. A randomized set of validators is then selected to query the data from the sources.
4. The results are then aggregated and recorded on the BandChain, making them available for dApp to use.
5. The dApp fetches the data and proof of validity from BandChain
6. The data and proof are batched with other function call parameters. The oracle data is then used in the callable function code in trustable and verifiable manner.

<p align="center">
  <a href="https://solana.com">
    <img alt="Solana" src="https://i.imgur.com/OMnvVEz.png" width="250" />
  </a>
</p>

[![Build status][travis-image]][travis-url]
[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/solana-labs/example-helloworld)

[travis-image]: https://travis-ci.org/solana-labs/example-helloworld.svg?branch=master
[travis-url]: https://travis-ci.org/solana-labs/example-helloworld

# PriceDB example on Solana

This project demonstrates how to use the [Solana Javascript API](https://github.com/solana-labs/solana-web3.js)
to build, deploy, and interact with programs on the Solana blockchain.

The project comprises of:

- An on-chain PriceDB program
- A client that can send a tx to set validators, set price and also verify proof before set price

## Table of Contents

- [PriceDB on Solana](#PriceDB-on-solana)
  - [Table of Contents](#table-of-contents)
  - [Quick Start](#quick-start)
    - [Start local Solana cluster](#start-local-solana-cluster)
    - [Build the on-chain program](#build-the-on-chain-program)
    - [Run the client](#run-the-client)
    - [Expected output](#expected-output)
      - [Not seeing the expected output?](#not-seeing-the-expected-output)
    - [Customizing the Program](#customizing-the-program)
  - [Learn about Solana](#learn-about-solana)
  - [Learn about the client](#learn-about-the-client)
    - [Entrypoint](#entrypoint)
    - [Establish a connection to the cluster](#establish-a-connection-to-the-cluster)
    - [Load the pricedb on-chain program if not already loaded](#load-the-pricedb-on-chain-program-if-not-already-loaded)
    - [Send a set validators tx](#send-a-set-validators-tx)
    - [Send a set price tx](#send-a-set-price-tx)
    - [Send a verify and set price tx](#send-a-verify-and-set-price-tx)
    - [Query an account info](#query-an-account-info)
  - [Learn about the on-chain program](#learn-about-the-on-chain-program)
    - [Entrypoint](#entrypoint-1)
    - [Processing an instruction](#processing-an-instruction)
    - [Rust limitations](#rust-limitations)
  - [Pointing to a public Solana cluster](#pointing-to-a-public-solana-cluster)
  - [Expand your skills with advanced examples](#expand-your-skills-with-advanced-examples)

## Quick Start

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/solana-labs/example-helloworld)

If you decide to open in Gitpod then refer to [README-gitpod.md](README-gitpod.md), otherwise continue reading.

The following dependencies are required to build and run this example,
depending on your OS, they may already be installed:

```bash
$ node --version # must be 11+
$ npm --version
$ docker -v
$ wget --version # If you are using mac, please also install wget
$ rustup --version
$ rustc --version
$ cargo --version
```

If this is your first time using Docker or Rust, these [Installation Notes](README-installation-notes.md) might be helpful.

### Start local Solana cluster

This example connects to a local Solana cluster by default.

Enable on-chain program logs:

```bash
$ export RUST_LOG=solana_runtime::system_instruction_processor=trace,solana_bpf_loader=debug,solana_rbpf=debug
```

Start a local Solana cluster:

```bash
$ npm run localnet:update
$ npm run localnet:up
```

View the cluster logs:

```bash
$ npm run localnet:logs
```

Note: To stop the local Solana cluster later:

```bash
$ npm run localnet:down
```

### Build the on-chain program

There is both a Rust and C version of the on-chain program, whichever is built last will be the one used when running the example.

```bash
$ npm run build:program-rust
```

```bash
$ npm run build:program-c
```

## Pointing to a public Solana cluster

Solana maintains three public clusters:

- `devnet` - Development cluster with airdrops enabled
- `testnet` - Tour De Sol test cluster without airdrops enabled
- `mainnet-beta` - Main cluster

Use npm scripts to configure which cluster.

To point to `devnet`:

```bash
$ npm run cluster:devnet
```

To point back to the local cluster:

```bash
$ npm run cluster:localnet
```

### Run the client

```bash
$ npm run start
```

![image](https://user-images.githubusercontent.com/12705423/81507301-a1c05c00-9326-11ea-8841-c29aba19150e.png)

### All expected outputs

Public key values will differ:

Set Price

```bash
Begin interaction with PriceDB program on solana
Connection to cluster established: http://devnet.solana.com { 'solana-core': '1.1.9 [channel=unknown commit=unknown]' }
9
69
Using account H13mq76MTDVZfq6ndDfGL9tG3PpJGgmkVZUh7CZr2KLq containing 0.6543296 Sol to pay for fees
Program already loaded to account 3Kuo1W2EXzfQP212B6QBVqxzUdDQ2JCFamNJVAkF2NF1
setPrice for  A5mQgu5daXq6fTbJt8BgMGDg1hgMMzgh9J1F88C8VNJG
Success
```

Set Validator

```bash
Begin interaction with PriceDB program on solana
Connection to cluster established: http://devnet.solana.com { 'solana-core': '1.1.9 [channel=unknown commit=unknown]' }
9
69
Using account H13mq76MTDVZfq6ndDfGL9tG3PpJGgmkVZUh7CZr2KLq containing 0.6543296 Sol to pay for fees
Program already loaded to account 3Kuo1W2EXzfQP212B6QBVqxzUdDQ2JCFamNJVAkF2NF1
setValidator for  AMtJgjNenSPG1tcJPuGLysZGQrt3nYGrxEnRnWbNSv5B
Success
```

Verify and set price

```bash
Begin interaction with PriceDB program on solana
Connection to cluster established: http://devnet.solana.com { 'solana-core': '1.1.9 [channel=unknown commit=unknown]' }
9
69
Using account FhL9EiPG5UM2WGeppGPYyNgCkSdi8QtY1DxNiEggxWor containing 0.6543296 Sol to pay for fees
Program already loaded to account BT8LW6MtbtZTSFHkqwQ7upFmQtfE3F7ttjxeMeE4uvtF
Verify and set price for  6KjsLku1BmM8PC2zTCvC46dXjLU83iVfBvqvHxEY9eR9  and  AMtJgjNenSPG1tcJPuGLysZGQrt3nYGrxEnRnWbNSv5B
Success
```

#### Not seeing the expected output?

- Ensure you've [started the local cluster](#start-local-solana-cluster) and [built the on-chain program](#build-the-on-chain-program).
- Ensure Docker is running. You might try bumping up its resource settings, 8 GB of memory and 3 GB of swap should help.
- Inspect the Solana cluster logs looking for any failed transactions or failed on-chain programs
  - Expand the log filter and restart the cluster to see more detail
    - ```bash
      $ npm run localnet:down
      $ export RUST_LOG=solana_runtime::native_loader=trace,solana_runtime::system_instruction_processor=trace,solana_runtime::bank=debug,solana_bpf_loader=debug,solana_rbpf=debug
      $ npm run localnet:up
      ```

### Customizing the Program

To customize the example, make changes to the files under `/src`. If you change any files under `/src/program-rust` or `/src/program-c` you will need to [rebuild the on-chain program](#build-the-on-chain-program)

Now when you rerun `npm run start`, you should see the results of your changes.

## Learn about Solana

More information about how Solana works is available in the [Solana documentation](https://docs.solana.com/) and all the source code is available on [github](https://github.com/solana-labs/solana)

Futher questions? Visit us on [Discord](https://discordapp.com/invite/pquxPsq)

## Learn about the client

The client in this example is written in JavaScript using:

- [Solana web3.js SDK](https://github.com/solana-labs/solana-web3.js)
- [Solana web3 API](https://solana-labs.github.io/solana-web3.js)

### Entrypoint

The [client's entrypoint](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L16) does four things

### Establish a connection to the cluster

The client establishes a connection with the client by calling [`establishConnection`](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L20).

### Load the pricedb on-chain program if not already loaded

The process of loading a program on the cluster includes storing the shared object's bytes in a Solana account's data vector and marking the account executable.

The client loads the program by calling [`loadProgram`](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L26). The first time `loadProgram` is called the client:

1. Read the shared object from the file system
2. Calculates the fees associated with loading the program
3. Airdrops lamports to a payer account to pay for the load
4. Loads the program via the Solana web3.js function ['BPFLoader.load'](<[TODO](https://github.com/solana-labs/solana-web3.js/blob/37d57926b9dba05d1ad505d4fd39d061030e2e87/src/bpf-loader.js#L36)>)
5. Creates a new "price keeper" account that will be used in the `setPrice` transaction and `verifyAndSetPrice` transaction
6. Creates a new "validator keeper" account that will be used in the `setValidator` transaction and `verifyAndSetPrice` transaction
7. Records the [public key](https://github.com/solana-labs/solana-web3.js/blob/37d57926b9dba05d1ad505d4fd39d061030e2e87/src/publickey.js#L10) of both the loaded `pricedb` program, the `price keeper` account and the `validator keeper` account in a config file. Repeated calls to the client will refer to the same loaded program and "greeter" account. (To force the reload of the program issue `npm clean:store`)

### Send a set validators tx

The client then constructs and sends a set validators transaction to the program by calling [`setValidator`](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L34). This function will receive PriceDB's program id, account of validators keeper and bytes instructions. The bytes instruction is a borsh encode of [`Command::SetValidator(Vec<ValidatorPubkey>)`](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/program-rust/src/lib.rs#L69)

For example

javascript client

```js
const instruction = new TransactionInstruction({
  keys: [{ pubkey: vkPubkey, isSigner: false, isWritable: true }],
  programId,
  // Borsh encode of ValidatorKeeper that contain pubkeys [1;32] and [2;32]
  data: Buffer.from(
    "010200000001010101010101010101010101010101010101010101010101010101010101010202020202020202020202020202020202020202020202020202020202020202",
    "hex"
  ),
});
await sendAndConfirmTransaction(
  "setValidator",
  connection,
  new Transaction().add(instruction),
  payerAccount
);
```

rust program

```rust
process_instruction(
    &program_id,
    &accounts,
    &(Command::SetValidator(vec![ValidatorPubkey(pub1), ValidatorPubkey(pub2)]))
        .try_to_vec()
        .unwrap(),
)
```

### Send a set price tx

The client then constructs and sends a set price transaction to the program by calling [`setPrice`](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L29). This function will receive PriceDB's program id, account of price keeper and bytes instructions. The bytes instruction is a borsh encode of [`SetPrice(Price)`](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/program-rust/src/lib.rs#L65)

For example

javascript client

```js
const instruction = new TransactionInstruction({
  keys: [{ pubkey: pdbkPubkey, isSigner: false, isWritable: true }],
  programId,
  // Set price to be 99, encode with borsh
  data: Buffer.from("006300000000000000", "hex"),
});
await sendAndConfirmTransaction(
  "setPrice",
  connection,
  new Transaction().add(instruction),
  payerAccount
);
```

rust program

```rust
process_instruction(&program_id, &accounts, &(vec![0, 99, 0, 0, 0, 0, 0, 0, 0])).unwrap();
```

### Send a verify and set price tx

The client then constructs and sends a verify and set price transaction to the program by calling [`VerifyAndSetPrice`](https://github.com/bandprotocol/band-integrations/blob/master/solana/blob/master/src/client/main.js#L39). This function will receive PriceDB's program id, account of price keeper, account of validators keeper and bytes instructions. The bytes instruction is a borsh encode of [`VerifyAndSetPrice(Vec<u8>)`](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/program-rust/src/lib.rs#L73)

For the realtime price data, please request the data from [`our scan`](http://scan-solana.surge.sh/oracle-script/1) by following these steps.

1. Click `connect` button at the top-right of the page
2. Enter your mnemonic and then click connect
3. Click `get 10 testnet BAND` at the top-right
4. Insert symbol `BTC` and mutiplier `100`
5. Click `request` button
6. Wait until you see `PROOF OF VALIDITY`
7. Click `copy as bytes`
8. Replace this [`line`](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/client/main.js#L41) with what you just copied

For example

javascript client

```js
const instruction = new TransactionInstruction({
  keys: [
    { pubkey: pdbkPubkey, isSigner: false, isWritable: true },
    { pubkey: vkPubkey, isSigner: false, isWritable: true },
  ],
  programId,
  data: Buffer.from(
    // [2;32] + 886270
    "02680000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000058002020202020202020202020202020202020202020202020202020202020202026f360e0000000000",
    "hex"
  ),
});
await sendAndConfirmTransaction(
  "VerifyAndSetPrice",
  connection,
  new Transaction().add(instruction),
  payerAccount
);
```

rust program

```rust
process_instruction(
  &program_id,
  &accounts,
  &(Command::VerifyAndSetPrice(calldata1)).try_to_vec().unwrap(),
)
```

### Query an account info

This is often used after sending a transaction that causes the account's data to change, so we have to query the account's info which is also contain account's data to see the change.

Example for query info of the account `A5mQgu5daXq6fTbJt8BgMGDg1hgMMzgh9J1F88C8VNJG` on http://devnet.solana.com

```bash
curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getAccountInfo", "params":["A5mQgu5daXq6fTbJt8BgMGDg1hgMMzgh9J1F88C8VNJG"]}' http://devnet.solana.com
```

## Learn about the on-chain program

The [on-chain pricedb program](src/program/Cargo.toml) is a Rust program compiled to [Berkley Packet Format (BPF)](https://en.wikipedia.org/wiki/Berkeley_Packet_Filter) and stored as an [Executable and Linkable Format (ELF) shared object](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format).

The program is written using:

- [Solana Rust SDK](https://github.com/solana-labs/solana/tree/master/sdk)

### Entrypoint

The program's [entrypoint](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/program-rust/src/lib.rs#L80) takes three parameters:

```rust
fn process_instruction<'a>(
    _program_id: &Pubkey, // Public key of the account the pricedb program was loaded into
    accounts: &'a [AccountInfo<'a>], // The accounts to be interacted with
    instruction_data: &[u8], // borsh encoded of Command
) -> ProgramResult {
```

- `program_id` is the public key of the currently executing program. The same program can be uploaded to the cluster under different accounts, and a program can use `program_id` to determine which instance of the program is currently executing.
- `accounts` is a slice of [`Account Info's](https://github.com/solana-labs/solana/blob/b4e00275b2da6028cc839a79cdc4453d4c9aca13/sdk/src/account_info.rs#L10) representing each account included in the instruction being processed.
- `_instruction_data` is a data vector containing the [data passed as part of the instruction](https://github.com/solana-labs/solana-web3.js/blob/37d57926b9dba05d1ad505d4fd39d061030e2e87/src/transaction.js#L46). In the case of pricedb the instruction data will be borsh encode of enum [Command](https://github.com/bandprotocol/band-integrations/blob/master/solana/src/program-rust/src/lib.rs#L64)

```rust
pub enum Command {
    // account 0: PriceDBKeeper account
    SetPrice(Price),
    // account 0: ValidatorKeeper account
    SetValidator(Vec<ValidatorPubkey>),
    // account 0: PriceDBKeeper account
    // account 1: ValidatorKeeper account
    VerifyAndSetPrice(Vec<u8>),
}
```

### Processing an instruction

Given the inputs to the entrypoint, the result of the instruction are updates to account's lamports and data vectors. In the case of pricedb program, the "price keeper" account's data holds a 9-bytes Borsh encoded of enum(u64) and the "validators keeper" account's data holds a 69-bytes Borsh encoded of enum(Vec<[u8;32]>)

The accounts slice may contain the same account in multiple positions, so a Rust `std protects any writable data::cell::RefCell`

The program prints a diagnostic message to the validators' logs by calling [`info!`](https://github.com/solana-labs/solana/blob/b4e00275b2da6028cc839a79cdc4453d4c9aca13/sdk/src/log.rs#L12). On a local cluster you can view the logs by including `solana_bpf_loader_program=info` in `RUST_LOG`.

If the program fails, it returns a `ProgramError`; otherwise, it returns `Ok(())` to indicate to the runtime that any updates to the accounts may be recorded on the chain.

### Rust limitations

On-chain Rust programs support most of Rust's libstd, libcore, and liballoc, as well as many 3rd party crates.

There are some limitations since these programs run in a resource-constrained, single-threaded environment, and must be deterministic:

- No access to
  - `rand` or any crates that depend on it
  - `std::fs`
  - `std::net`
  - `std::os`
  - `std::future`
  - `std::net`
  - `std::process`
  - `std::sync`
  - `std::task`
  - `std::thread`
  - `std::time`
- Limited access to:
  - `std::hash`
  - `std::os`
- Bincode is extreamly computationally expensive in both cycles and call depth and should be avoided
- String formating should be avoided since it is also computationaly expensive
- No support for `println!`, `print!`, the Solana SDK helpers in `src/log.rs` should be used instead
- The runtime enforces a limit on the number of instructions a program can execute during the processing of one instruction

## QA

- Do Solana have an example for a smart contract calling another smart contract ?

  - ```bash
    Not yet, Solana are currently adding this functionality. Stay tuned
    By the way, you can already read any account's data without calling other programs.
    Contract A can check if account.owner == B
    You don’t need a cross program call
    Program A can read state from program B in an atomic transaction

    Think of programs as simple functions over a key value store
    They take a set of key/values, and update a subset of the values
    ```

- I might need hash functions such as sha2_256 and keccak. And also want to use encoding lib such as [Borsh](https://docs.rs/borsh/0.6.1/borsh/). Are these possible ?

  - ```bash
    If its a rust library then sure!
    Borsh is a lot slower then casting 😃
    Please see https://github.com/solana-labs/example-helloworld#rust-limitations
    ```

- How do I create key value map like in Ethereum such as mapping(string => uint), mapping(uint => uint), .etc ?

  - ```bash
    You can store a map(int => int) or a map(address => any) inside a single account
    the data has no restrictions of use, so long as your program can serialize / deserialize the information it needs
    ```

- The account data should not contain dynamic size data structure (array, list, etc). Right?

  - ```bash
    This isn't true actually.
    You cannot dynamically resize account data but you can pre-allocate the capacity you need.
    You can store whatever data structures you want in the data. It could be a map, list, struct, etc
    ```

- So the size of map was limited when I first create the account ?

  - ```bash
    Exactly
    ```

- How to create BufferLayout for

  ```rust
  pub enum State {
      Unset,
      Validators(Vec<Pubkey>),
  }
  ```

  I just want to reserve a space for two validators.

  - ```bash
    You can try using serde to serialize your data structures but so far we've been manually laying out data.
    You can look at this example:
    https://github.com/solana-labs/example-messagefeed/blob/v1.1/bpf-rust-programs/prediction-poll/program_data/src/collection.rs
    From the example, you should use BufferLayout.blob(32, property) for a single Pubkey allocation
    ```

- What is lamports ? Is it like wei in Ethereum ?

  - ```bash
    Exactly
    The balance is measured in lamports. 1 lamport = 0.000000001 SOL
    ```

- I Have to put Sol into the account reserve space for account's data, right?.

  - ```bash
    That's correct! Every account needs to pay rent
    ```

- Can I rent more space for account's data by transferring more lamports into the account ?

  - ```bash
    Nop, because the account balance and the account data capacity are two different things.
    For example, an account can have 1000 SOL and 0 data capacity.
    Another account can have 1 SOL and 1KB data capacity.
    The only relation between account balance and account data capacity is for rent payments.
    The more data you store, the more expensive it will be and so your account will need a sufficient balance to pay for rent fees.
    ```

- Can I rent more space for an account or the space determined only when creating an account and can't be changed?

  - ```bash
    Can't be changed
    Realloc is hard once the system program is no longer the owner of the account.
    We'd need an entirely new mechanism to do that.
    So your best bet is create a larger account when the current account data is almost full, and then copy over the data.
    ```

- I received this following error message after I made a transaction.
  `RangeError [ERR_OUT_OF_RANGE]: The value of "offset" is out of range. It must be >= 0 and <= 1231. Received 1232`
  I think it's because the calldata I sent was too big.
  The data that I send with a transaction is 3272 bytes.
  Can I increase this limit, or should the data I submit for each tx must be limited to 1231 bytes?

  - ```bash
    You cannot increase this limit but there are workarounds.
    You can split up the proof into chunks
    For example let separate your big tx into multiple of smaller txs and then send them one by one
    This is how we load programs onto the chain

    So you should create an account to accumulate the fragments until it's complete.
    Then read the proof stored in that account for verification.
    ```

## Expand your skills with advanced examples

There is lots more to learn; The following examples demonstrate more advanced features like custom errors, advanced account handling, suggestions for data serialization, benchmarking, etc..

- [hello-world](https://github.com/solana-labs/example-helloworld#learn-about-solana)
- [ERC-20-like Token](https://github.com/solana-labs/example-token)
- [TicTacToe](https://github.com/solana-labs/example-tictactoe)
- [MessageFeed](https://github.com/solana-labs/example-messagefeed)
