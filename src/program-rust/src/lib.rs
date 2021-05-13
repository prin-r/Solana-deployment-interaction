use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct Price {
    symbol: [u8; 8],
    rate: u64,
    last_updated: u64,
    request_id: u64,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct StdReferenceBasic {
    owner: [u8; 32],
    current_size: u8,
    prices: Vec<Price>,
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct SimplePriceDB {
    owner: [u8; 32],
    latest_symbol: [u8; 8],
    latest_price: u64,
}

/// Commands supported by the program
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum Command {
    Init([u8; 32]),
    TransferOwnership([u8; 32]),
    SetPrice([u8; 8]),
}

fn is_initialized(arr: &Vec<u8>) -> bool {
    arr.iter().fold(0u32, |s, &x| s + (x as u32)) > 0
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
fn process_instruction<'a>(
    _program_id: &Pubkey, // Public key of the account the pricedb program was loaded into
    accounts: &'a [AccountInfo<'a>], // The accounts to be interacted with
    instruction_data: &[u8], // borsh encoded of Command
) -> ProgramResult {
    msg!("Begin pricedb Rust program entrypoint");

    let command = Command::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    let account_info_iter = &mut accounts.iter();

    match command {
        Command::Init(owner) => {
            msg!("Init!");
            let proxy_account = next_account_info(account_info_iter)?;
            let temp = (*proxy_account.data.borrow()).to_vec();

            if is_initialized(&temp) {
                return Err(ProgramError::AccountAlreadyInitialized);
            }

            let mut spdb = SimplePriceDB::try_from_slice(&temp).map_err(|_| ProgramError::Custom(113))?;
            spdb.owner = owner;
            spdb.latest_symbol = [0u8; 8];
            spdb.latest_price = 0u64;

            spdb.serialize(&mut &mut proxy_account.data.borrow_mut()[..])?;

            Ok(())
        }
        Command::TransferOwnership(new_owner) => {
            msg!("TransferOwnership!");
            let simple_price_db = next_account_info(account_info_iter)?;
            let sender = next_account_info(account_info_iter)?;
            if !sender.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let temp = (*simple_price_db.data.borrow()).to_vec();
            if !is_initialized(&temp) {
                return Err(ProgramError::UninitializedAccount);
            }

            let mut spdb = SimplePriceDB::try_from_slice(&temp).map_err(|_| ProgramError::Custom(113))?;

            // check owner
            if spdb.owner != sender.key.to_bytes() {
                return Err(ProgramError::Custom(112));
            }

            // set owner
            spdb.owner = new_owner;
            // save state
            spdb.serialize(&mut &mut simple_price_db.data.borrow_mut()[..])?;
            Ok(())
        }
        Command::SetPrice(symbol) => {
            msg!("SetPrice!");
            let simple_price_db = next_account_info(account_info_iter)?;
            let sender = next_account_info(account_info_iter)?;
            let std_reference_account = next_account_info(account_info_iter)?;

            // check that sender is signer
            if !sender.is_signer {
                return Err(ProgramError::MissingRequiredSignature);
            }

            let temp = (*simple_price_db.data.borrow()).to_vec();
            if !is_initialized(&temp) {
                return Err(ProgramError::UninitializedAccount);
            }

            let mut spdb = SimplePriceDB::try_from_slice(&temp).map_err(|_| ProgramError::Custom(113))?;

            // check owner
            if spdb.owner != sender.key.to_bytes() {
                return Err(ProgramError::Custom(112));
            }

            // get std_reference's state
            let temp2 = (*std_reference_account.data.borrow()).to_vec();
            let std_reference = StdReferenceBasic::try_from_slice(&temp2).map_err(|_| ProgramError::Custom(113))?;

            let rate = std_reference.prices.iter().find(|&p| p.symbol == symbol).map_or(None, |p| Some(p.rate));
            if rate.is_none() {
                msg!("Price not found !");
                return Err(ProgramError::Custom(115));
            }

            // set latest price and symbol
            spdb.latest_price = rate.unwrap();
            spdb.latest_symbol = symbol;

            // save state
            spdb.serialize(&mut &mut simple_price_db.data.borrow_mut()[..])?;
            Ok(())
        }
    }
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_sdk::clock::Epoch;

    fn new_pubkey(id: u8) -> Pubkey {
        Pubkey::new(&vec![
            id, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 1, 1,
        ])
    }

    // #[test]
    // fn test_1() {
    //     let program_id = new_pubkey(1);
    //     let key = new_pubkey(2);
    //     let mut lamports = 0;
    //     let mut data = vec![0, 0, 0, 0, 0, 0, 0, 0, 0];
    //     let owner = new_pubkey(3);
    //     let account = AccountInfo::new(
    //         &key,
    //         false,
    //         true,
    //         &mut lamports,
    //         &mut data,
    //         &owner,
    //         false,
    //         Epoch::default(),
    //     );

    //     let accounts = vec![account];

    //     assert_eq!(PriceDBKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),);

    //     process_instruction(&program_id, &accounts, &(vec![0, 10, 0, 0, 0, 0, 0, 0, 0])).unwrap();
    //     assert_eq!(
    //         PriceDBKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         PriceDBKeeper::LatestPrice(Price { px: 10 })
    //     );

    //     process_instruction(&program_id, &accounts, &(vec![0, 99, 0, 0, 0, 0, 0, 0, 0])).unwrap();
    //     assert_eq!(
    //         PriceDBKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         PriceDBKeeper::LatestPrice(Price { px: 99 })
    //     );
    // }

    // #[test]
    // fn test_2() {
    //     let program_id = new_pubkey(1);
    //     let key = new_pubkey(2);
    //     let mut lamports = 0;
    //     // contain 2 validators
    //     let mut data =
    //         ValidatorKeeper::Validators(vec![ValidatorPubkey([0; 32]), ValidatorPubkey([0; 32])])
    //             .try_to_vec()
    //             .unwrap();
    //     let owner = new_pubkey(3);
    //     let account = AccountInfo::new(
    //         &key,
    //         false,
    //         true,
    //         &mut lamports,
    //         &mut data,
    //         &owner,
    //         false,
    //         Epoch::default(),
    //     );

    //     let accounts = vec![account];

    //     assert_eq!(
    //         ValidatorKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         ValidatorKeeper::Validators(vec![ValidatorPubkey([0; 32]), ValidatorPubkey([0; 32])])
    //     );

    //     let mut pub1 = [0u8; 32];
    //     let mut pub2 = [0u8; 32];
    //     let mut tmp1 = Sha3_256::new();
    //     let mut tmp2 = Sha3_256::new();
    //     tmp1.input(b"abc");
    //     tmp2.input(b"def");

    //     pub1.copy_from_slice(tmp1.result().as_slice());
    //     pub2.copy_from_slice(tmp2.result().as_slice());

    //     process_instruction(
    //         &program_id,
    //         &accounts,
    //         &(Command::SetValidator(vec![ValidatorPubkey(pub1), ValidatorPubkey(pub2)]))
    //             .try_to_vec()
    //             .unwrap(),
    //     )
    //     .unwrap();
    //     assert_eq!(
    //         ValidatorKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         ValidatorKeeper::Validators(vec![ValidatorPubkey(pub1), ValidatorPubkey(pub2)])
    //     );
    // }

    // #[test]
    // fn test_3() {
    //     let program_id = new_pubkey(1);
    //     let key1 = new_pubkey(2);
    //     let mut lamports1 = 0;
    //     // contain 2 validators
    //     let mut data1 =
    //         ValidatorKeeper::Validators(vec![ValidatorPubkey([1; 32]), ValidatorPubkey([2; 32])])
    //             .try_to_vec()
    //             .unwrap();
    //     let owner1 = new_pubkey(3);
    //     let vk_account = AccountInfo::new(
    //         &key1,
    //         false,
    //         true,
    //         &mut lamports1,
    //         &mut data1,
    //         &owner1,
    //         false,
    //         Epoch::default(),
    //     );

    //     let key2 = new_pubkey(4);
    //     let mut lamports2 = 0;
    //     let mut data2 = vec![0, 0, 0, 0, 0, 0, 0, 0, 0];
    //     let owner2 = new_pubkey(5);
    //     let simple_price_db = AccountInfo::new(
    //         &key2,
    //         false,
    //         true,
    //         &mut lamports2,
    //         &mut data2,
    //         &owner2,
    //         false,
    //         Epoch::default(),
    //     );

    //     let accounts = vec![simple_price_db, vk_account];

    //     assert_eq!(
    //         PriceDBKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         PriceDBKeeper::Unallocated(0)
    //     );

    //     assert_eq!(
    //         ValidatorKeeper::try_from_slice(&accounts[1].data.borrow()).unwrap(),
    //         ValidatorKeeper::Validators(vec![ValidatorPubkey([1; 32]), ValidatorPubkey([2; 32])])
    //     );

    //     let calldata1 = [0; 32].to_vec();
    //     assert_eq!(
    //         process_instruction(
    //             &program_id,
    //             &accounts,
    //             &(Command::VerifyAndSetPrice(calldata1))
    //                 .try_to_vec()
    //                 .unwrap(),
    //         ),
    //         Err(ProgramError::Custom(998))
    //     );

    //     let mut calldata2 = [0; 32].to_vec();
    //     calldata2.append(&mut vec![254, 133, 13, 0, 0, 0, 0, 0]);
    //     assert_eq!(
    //         process_instruction(
    //             &program_id,
    //             &accounts,
    //             &(Command::VerifyAndSetPrice(calldata2))
    //                 .try_to_vec()
    //                 .unwrap(),
    //         ),
    //         Err(ProgramError::Custom(999))
    //     );

    //     let mut calldata3 = [2; 32].to_vec();
    //     calldata3.append(&mut vec![254, 133, 13, 0, 0, 0, 0, 0]);
    //     process_instruction(
    //         &program_id,
    //         &accounts,
    //         &(Command::VerifyAndSetPrice(calldata3))
    //             .try_to_vec()
    //             .unwrap(),
    //     )
    //     .unwrap();

    //     assert_eq!(
    //         PriceDBKeeper::try_from_slice(&accounts[0].data.borrow()).unwrap(),
    //         PriceDBKeeper::LatestPrice(Price { px: 886270 })
    //     );
    // }
}

