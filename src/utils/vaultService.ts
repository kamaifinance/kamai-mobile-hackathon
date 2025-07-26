import { Connection, PublicKey, Transaction, VersionedTransaction, TransactionSignature, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import VaultImpl, { KEEPER_URL } from '@meteora-ag/vault-sdk';
import { BN } from 'bn.js';
import { StaticTokenListResolutionStrategy, TokenInfo } from '@solana/spl-token-registry';
import { Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';


// 1. Set up devnet connection
const DEVNET_RPC = 'https://api.devnet.solana.com/';
const connection = new Connection(DEVNET_RPC, { commitment: 'confirmed' })

// Get on-chain data from the vault and off-chain data from the api
export const getVaultDetails = async (vaultImpl: VaultImpl) => {
  //Get the total unlocked amount in vault that is withdrawable by users
  const vaultUnlockedAmount = (await vaultImpl.getWithdrawableAmount()).toNumber();

  const tokenMap = new StaticTokenListResolutionStrategy().resolve();
  const SOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'SOL') as TokenInfo;

  //Calculate virtual price using the vault's unlocked amount and lp supply
  const virtualPrice = (vaultUnlockedAmount / (await vaultImpl.getVaultSupply()).toNumber()) || 0;

  // Get the off-chain data from API
  const URL = KEEPER_URL['devnet'];
  const vaultStateAPI: any = await (await fetch(`${URL}/vault_state/${SOL_TOKEN_INFO.address}`)).json();
  const totalAllocation = vaultStateAPI.strategies.reduce((acc: number, item: any) => acc + item.liquidity, vaultStateAPI.token_amount)

  return {
    lpSupply: (await vaultImpl.getVaultSupply()).toString(),
    withdrawableAmount: vaultUnlockedAmount,
    virtualPrice,
    usd_rate: vaultStateAPI.usd_rate,
    closest_apy: vaultStateAPI.closest_apy, // 1 hour average APY
    average_apy: vaultStateAPI.average_apy, // 24 hour average APY
    long_apy: vaultStateAPI.long_apy, // 7 day average APY
    earned_amount: vaultStateAPI.earned_amount, // total fees earned by vault
    virtual_price: vaultStateAPI.virtual_price,
    total_amount: vaultStateAPI.total_amount,
    total_amount_with_profit: vaultStateAPI.total_amount_with_profit,
    token_amount: vaultStateAPI.token_amount,
    fee_amount: vaultStateAPI.fee_amount,
    lp_supply: vaultStateAPI.lp_supply,
    strategyAllocation: vaultStateAPI.strategies
      .map((item: any) => ({
        name: item.strategy_name,
        liquidity: item.liquidity,
        allocation: ((item.liquidity / totalAllocation) * 100).toFixed(0),
        maxAllocation: item.max_allocation,
      }))
      .concat({
        name: 'Vault Reserves',
        liquidity: vaultStateAPI.token_amount,
        allocation: ((vaultStateAPI.token_amount / totalAllocation) * 100).toFixed(0),
        maxAllocation: 0,
      })
      .sort((a: any, b: any) => b.liquidity - a.liquidity),
  }
}


/**
 * Get available Meteora vaults on devnet
 * @returns Array of available vault information
 */
export const getVaults = async (): Promise<any> => {
  try {
    console.log('Starting getVaults function...');
    const vaults: any[] = [];

    console.log('Resolving token map in getVaults...');
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    const SOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'SOL') as TokenInfo;

    if (!SOL_TOKEN_INFO) {
      throw new Error('SOL token not found in token registry');
    }

    console.log('Creating vault in getVaults for:', SOL_TOKEN_INFO.address);
    const vault: VaultImpl = await VaultImpl.create(
      connection,
      new PublicKey(SOL_TOKEN_INFO.address),
      {
        cluster: 'devnet'
      }
    );

    console.log('Vault created successfully in getVaults:', !!vault);



    vaults.push({
      vault: vault,
      name: "Boosted SOL Vault",
      tokenSymbol: "SOL",
      description: 'Earn yield on your SOL with dynamic strategies',
      apy: 8.5, // Example APY
      totalValueLocked: 1234567.89, // Example TVL
    });


    return vaults;
  } catch (error) {
    console.error('Error loading vaults:', error);
    throw new Error('Failed to load available vaults');
  }
};

// 3. Get vault instance for a specific token mint
const getVault = async (tokenMint: PublicKey) => {
  return await VaultImpl.create(connection, tokenMint, { cluster: 'devnet' });
};

/**
 * Get user's balance in the SOL vault
 * @param userPublicKey - User's public key
 * @returns Object containing user's withdrawable amount from the vault
 */
export const getUserVaultBalance = async (userPublicKey: PublicKey) => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    const SOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'SOL') as TokenInfo;
    
    if (!SOL_TOKEN_INFO) {
      throw new Error('SOL token not found in token registry');
    }
    
    const vault = await getVault(new PublicKey(SOL_TOKEN_INFO.address));
    
    // Get user's LP token balance in the vault
    const userLpBalance = await vault.getUserBalance(userPublicKey);
    
    // Calculate withdrawable amount based on LP balance
    const vaultSupply = await vault.getVaultSupply();
    const totalWithdrawableAmount = await vault.getWithdrawableAmount();
    
    // Calculate user's share: (user LP balance / total LP supply) * total withdrawable amount
    const userWithdrawableAmount = vaultSupply.isZero() 
      ? new BN(0)
      : userLpBalance.mul(totalWithdrawableAmount).div(vaultSupply);
    
    return {
      userLpBalance: userLpBalance.toNumber() / LAMPORTS_PER_SOL, // Convert to SOL
      withdrawableAmount: userWithdrawableAmount.toNumber() / LAMPORTS_PER_SOL, // Convert to SOL
      hasBalance: !userLpBalance.isZero()
    };
  } catch (error) {
    console.error('Error getting user vault balance:', error);
    return {
      userLpBalance: 0,
      withdrawableAmount: 0,
      hasBalance: false
    };
  }
};

/**
 * Deposit tokens into Meteora vault.
 * @param signAndSendTransaction - Function to sign and send transaction
 * @param publicKey - User's public key
 * @param amount - Amount in tokens (not smallest unit), e.g. 0.01 for 0.01 SOL
 * @returns transaction signature string
 */
export const depositToVault = async (
  publicKey: PublicKey,
  amount: number
): Promise<any> => {
  try {
    console.log('Starting vault deposit process...');
    console.log('Deposit amount:', amount);
    console.log('Public key:', publicKey.toString());
    
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid deposit amount. Amount must be greater than 0.');
    }

    // Check user's SOL balance
    console.log('Checking user balance...');
    let balance, balanceInSol;
    try {
      balance = await connection.getBalance(publicKey);
      balanceInSol = balance / 10**9;
      console.log('User SOL balance:', balanceInSol);
      
      if (balanceInSol < amount + 0.01) { // Need extra for transaction fees
        throw new Error(`Insufficient SOL balance. You have ${balanceInSol.toFixed(4)} SOL but need ${amount + 0.01} SOL (including fees).`);
      }
    } catch (balanceError: any) {
      console.error('Balance check failed:', balanceError);
      throw new Error(`Failed to check balance: ${balanceError?.message || 'Network connection failed'}`);
    }

    // Get SOL token info
    console.log('Resolving token list...');
    let tokenMap, SOL_TOKEN_INFO;
    try {
      tokenMap = new StaticTokenListResolutionStrategy().resolve();
      SOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'SOL');

      if (!SOL_TOKEN_INFO) {
        throw new Error('SOL token info not found in token registry');
      }

      console.log('SOL token address:', SOL_TOKEN_INFO.address);
    } catch (tokenError: any) {
      console.error('Token resolution failed:', tokenError);
      throw new Error(`Failed to resolve SOL token info: ${tokenError?.message || 'Unknown token error'}`);
    }

    // Create vault instance
    console.log('Creating vault instance for SOL...');
    console.log('Using SOL address:', SOL_TOKEN_INFO.address);
    
    let vault;
    try {
      vault = await getVault(new PublicKey(SOL_TOKEN_INFO.address));
      console.log('Vault created successfully');
      
      // Check if vault is properly initialized
      const vaultSupply = await vault.getVaultSupply();
      const withdrawableAmount = await vault.getWithdrawableAmount();
      console.log('Vault info:', {
        supply: vaultSupply.toString(),
        withdrawableAmount: withdrawableAmount.toString()
      });
      
    } catch (vaultError: any) {
      console.error('Vault creation failed:', vaultError);
      throw new Error(`Failed to create vault: ${vaultError?.message || 'Unknown vault error'}`);
    }

    // Calculate deposit amount in lamports (SOL has 9 decimals)
    const depositAmountLamports = new BN(Math.floor(amount * 10 ** 9));
    console.log('Deposit amount in lamports:', depositAmountLamports.toString());
    
    if (depositAmountLamports.isZero()) {
      throw new Error('Deposit amount too small. Minimum deposit is 0.000000001 SOL.');
    }
    const depositTx = await vault.deposit(publicKey, depositAmountLamports);
    console.log('Deposit transaction built successfully');
    
    return {
      transaction: depositTx,
      minContextSlot: await connection.getSlot()
    };

  } catch (error: any) {
    console.log('Detailed error in depositToVault:', error);
  }
};

