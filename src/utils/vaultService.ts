import { Connection, PublicKey, Transaction, VersionedTransaction, TransactionSignature, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import VaultImpl from '@meteora-ag/vault-sdk';
import { BN } from 'bn.js';
import { StaticTokenListResolutionStrategy, TokenInfo } from '@solana/spl-token-registry';
import { Mint, unpackMint } from "@solana/spl-token";
// 1. Set up devnet connection
const DEVNET_RPC = 'https://api.devnet.solana.com/';
const connection = new Connection(DEVNET_RPC, { commitment: 'confirmed' })

// Token addresses for supported vaults
const SUPPORTED_TOKENS = {
  // LSTs (Liquid Staking Tokens)
  SOL: 'So11111111111111111111111111111111111111112',
  
  // Stables (Stablecoins)  
  USDC: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
};

// Token categories
export const TOKEN_CATEGORIES = {
  LSTS: 'LSTs',
  STABLES: 'Stables'
} as const;

const keeperBaseUrl = "https://merv2-api.meteora.ag";

const lendingProgramIdsToName = new Map<string, string>([
  ["MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA", "MarginFi"],
  ["So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo", "Solend"],
  ["KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", "Kamino"],
]);



// //   vaultImpl: VaultImpl,
// //   tokenAddress?: string
// // ) => {
// //   // Get on-chain vault state directly from the instance
// //   const vaultState = vaultImpl.vaultState;
// //   const tokenMint = vaultImpl.tokenMint;
// //   const lpMint = vaultImpl.tokenLpMint;

// //   // Get dynamic data
// //   const lpSupply = await vaultImpl.getVaultSupply();
// //   const withdrawableAmount = await vaultImpl.getWithdrawableAmount();
// //   const strategiesState = await vaultImpl.getStrategiesState();

// //   // Get token info for display purposes
// //   const tokenMap = new StaticTokenListResolutionStrategy().resolve();
// //   let tokenInfo: TokenInfo | undefined;
// //   if (tokenAddress) {
// //     tokenInfo = tokenMap.find((token) => token.address === tokenAddress);
// //   } else {
// //     // Use the token mint from vault state
// //     tokenInfo = tokenMap.find(
// //       (token) => token.address === vaultState.tokenMint.toString()
// //     );
// //   }

// //   if (!tokenInfo) {
// //     // Fallback: create basic token info from mint
// //     tokenInfo = {
// //       symbol: "UNKNOWN",
// //       name: "Unknown Token",
// //       address: vaultState.tokenMint.toString(),
// //       decimals: tokenMint.decimals,
// //       logoURI: "",
// //       tags: [],
// //       chainId: 103, // Solana devnet
// //     } as TokenInfo;
// //   }

// //   // Calculate virtual price using the vault's unlocked amount and lp supply
// //   const virtualPrice = lpSupply.isZero()
// //     ? 0
// //     : withdrawableAmount.toNumber() / lpSupply.toNumber();

// //   // Get off-chain data from API
// //   let vaultStateAPI: any = {};
// //   try {
// //     const URL = KEEPER_URL["devnet"];
// //     console.log('URL', `${URL}/vault_state/${tokenInfo.address}`);
// //     const response = await fetch(`${URL}/vault_state/${tokenInfo.address}`);
// //     console.log('response', response);
// //     vaultStateAPI = await response.json();
// //   } catch (error) {
// //     console.warn("Failed to fetch vault state API:", error);
// //   }

// //   // Calculate total allocation
// //   const totalAllocation =
// //     vaultStateAPI.strategies?.reduce(
// //       (acc: number, item: any) => acc + item.liquidity,
// //       vaultStateAPI.token_amount || 0
// //     ) || withdrawableAmount.toNumber();

// //   return {
// //     vaultPda: vaultImpl.vaultPda.toString(),
// //     tokenVaultPda: vaultImpl.tokenVaultPda.toString(),
// //     tokenMint: vaultState.tokenMint.toString(),
// //     lpMint: vaultState.lpMint.toString(),

// //     tokenInfo,
// //     tokenDecimals: tokenMint.decimals,
// //     lpDecimals: lpMint.decimals,

// //     vaultBump: vaultState?.bump as any,
// //     tokenVaultBump: vaultState.tokenVaultBump as any,
// //     lpMintBump: vaultState.lpMintBump as any,
// //     enabled: vaultState.enabled,
// //     lockedProfitTracker: {
// //       lastReport: vaultState.lockedProfitTracker.lastReport.toNumber(),
// //       lockedProfitReleaseRate:
// //         vaultState.lockedProfitTracker.lockedProfitReleaseRate.toString(),
// //       lastLockedProfit:
// //         vaultState.lockedProfitTracker.lastLockedProfit.toString(),
// //     },
// //     feeStructure: {
// //       treasuryFee: vaultState.feeStructure.treasuryFee,
// //       managementFee: vaultState.feeStructure.managementFee,
// //       performanceFee: vaultState.feeStructure.performanceFee,
// //     },
// //     totalAmount: vaultState.totalAmount.toString(),
// //     strategies: vaultState.strategies.map((strategy) => strategy.toString()),
// //     base: vaultState.base.toString(),

// //     lpSupply: lpSupply.toString(),
// //     withdrawableAmount: withdrawableAmount.toNumber(),
// //     virtualPrice,

// //     strategiesState: strategiesState.map((strategy) => ({
// //       currentLiquidity: strategy.currentLiquidity.toString(),
// //       maxDeposit: strategy.maxDeposit.toString(),
// //       minDeposit: strategy.minDeposit.toString(),
// //       currentDeposit: strategy.currentDeposit.toString(),
// //     })),

// //     ...(vaultStateAPI.usd_rate && {
// //       usd_rate: vaultStateAPI.usd_rate,
// //       closest_apy: vaultStateAPI.closest_apy,
// //       average_apy: vaultStateAPI.average_apy,
// //       long_apy: vaultStateAPI.long_apy,
// //       earned_amount: vaultStateAPI.earned_amount,
// //       total_amount_with_profit: vaultStateAPI.total_amount_with_profit,
// //       fee_amount: vaultStateAPI.fee_amount,
// //       strategyAllocation: vaultStateAPI.strategies
// //         ?.map((item: any) => ({
// //           name: item.strategy_name,
// //           liquidity: item.liquidity,
// //           allocation: ((item.liquidity / totalAllocation) * 100).toFixed(0),
// //           maxAllocation: item.max_allocation,
// //         }))
// //         .concat({
// //           name: "Vault Reserves",
// //           liquidity: vaultStateAPI.token_amount,
// //           allocation: (
// //             (vaultStateAPI.token_amount / totalAllocation) *
// //             100
// //           ).toFixed(0),
// //           maxAllocation: 0,
// //         })
// //         .sort((a: any, b: any) => b.liquidity - a.liquidity),
// //     }),
// //   };
// // };


// // // Get on-chain data from the vault and off-chain data from the api
// export const getVaultDetails = async (vaultImpl: VaultImpl, tokenAddress?: string) => {
//   //Get the total unlocked amount in vault that is withdrawable by users
//   const vaultUnlockedAmount = (await vaultImpl.getWithdrawableAmount()).toNumber();

//   const tokenMap = new StaticTokenListResolutionStrategy().resolve();
//   let tokenInfo: TokenInfo | undefined;
//   if (tokenAddress) {
//     tokenInfo = tokenMap.find(token => token.address === tokenAddress);
//   } else {
//     // fallback to SOL if not provided
//     tokenInfo = tokenMap.find(token => token.symbol === 'SOL');
//   }
//   if (!tokenInfo) {
//     throw new Error('Token info not found for the provided address');
//   }

//   //Calculate virtual price using the vault's unlocked amount and lp supply
//   const virtualPrice = (vaultUnlockedAmount / (await vaultImpl.getVaultSupply()).toNumber()) || 0;

//   // Get the off-chain data from API
//   let vaultStateAPI: any;
//   try {
//     const URL = KEEPER_URL['devnet'];
//     console.log(KEEPER_URL)
//     console.log('Fetching vault state API for:', tokenInfo.address, 'with URL:', `${URL}/vault_state/${tokenInfo.address}`);
//     const response = await fetch(`${URL}/vault_state/${tokenInfo.address}`);
//     vaultStateAPI = await response.json();
//   } catch (error) {
//     console.error('Failed to fetch vault state API:', error);
//     throw new Error('Failed to fetch vault state API');
//   }
  
//   const totalAllocation = vaultStateAPI.strategies.reduce((acc: number, item: any) => acc + item.liquidity, vaultStateAPI.token_amount)

//   return {
//     lpSupply: (await vaultImpl.getVaultSupply()).toString(),
//     withdrawableAmount: vaultUnlockedAmount,
//     virtualPrice,
//     usd_rate: vaultStateAPI.usd_rate,
//     closest_apy: vaultStateAPI.closest_apy, // 1 hour average APY
//     average_apy: vaultStateAPI.average_apy, // 24 hour average APY
//     long_apy: vaultStateAPI.long_apy, // 7 day average APY
//     earned_amount: vaultStateAPI.earned_amount, // total fees earned by vault
//     virtual_price: vaultStateAPI.virtual_price,
//     total_amount: vaultStateAPI.total_amount,
//     total_amount_with_profit: vaultStateAPI.total_amount_with_profit,
//     token_amount: vaultStateAPI.token_amount,
//     fee_amount: vaultStateAPI.fee_amount,
//     lp_supply: vaultStateAPI.lp_supply,
//     strategyAllocation: vaultStateAPI.strategies
//       .map((item: any) => ({
//         name: item.strategy_name,
//         liquidity: item.liquidity,
//         allocation: ((item.liquidity / totalAllocation) * 100).toFixed(0),
//         maxAllocation: item.max_allocation,
//       }))
//       .concat({
//         name: 'Vault Reserves',
//         liquidity: vaultStateAPI.token_amount,
//         allocation: ((vaultStateAPI.token_amount / totalAllocation) * 100).toFixed(0),
//         maxAllocation: 0,
//       })
//       .sort((a: any, b: any) => b.liquidity - a.liquidity),
//   }
// }

async function getVaultApy(tokenMint: PublicKey): Promise<number> {
  try {
    const response = await fetch(
      `${keeperBaseUrl}/vault_state/${tokenMint.toBase58()}`
    );
    
    if (!response.ok) {
      throw new Error(`API response not ok: ${response.status}`);
    }

    const data = await response.json();
    const apy = Number(data.closest_apy);
    
    if (isNaN(apy)) {
      throw new Error('Invalid APY data from API');
    }
    
    return Math.ceil(apy * 100) / 100;
  } catch (error) {
    console.warn(`Failed to fetch APY for ${tokenMint.toBase58()}:`, error);
    // Return a fallback APY if API fails
    return 0;
  }
}

export async function getVaultDetails(vaultImpl: VaultImpl, tokenAddress: string = SUPPORTED_TOKENS.SOL) {
  // Get mint info for the specific vault passed in
  const mintAccount = await connection.getAccountInfo(vaultImpl.vaultState.tokenMint);
  if (!mintAccount) {
    throw new Error('Mint account not found');
  }
  const mintState = unpackMint(vaultImpl.vaultState.tokenMint, mintAccount);

  console.log(`Vault for mint ${vaultImpl.vaultState.tokenMint.toBase58()}`);
  console.log(`Vault address: ${vaultImpl.vaultPda.toBase58()}`);

  // Total amount in vault
  const totalAmount = Number(vaultImpl.vaultState.totalAmount.toString());
  const vaultTotalUiAmount = totalAmount / 10 ** mintState.decimals;
  console.log(`Total amount in vault: ${vaultTotalUiAmount}`);

  const lpMintSupply = Number(vaultImpl.tokenLpMint.supply.toString());
  const virtualPrice = totalAmount / lpMintSupply;

  // Vault LP to token amount exchange rate
  console.log(`Virtual Price: ${virtualPrice}`);

  // This is the current max withdrawable amount from the vault after deduct locked to drip profits + token allocated to strategies
  const withdrawableAmount = await vaultImpl.getWithdrawableAmount();
  const withdrawableUiAmount = withdrawableAmount.toNumber() / 10 ** mintState.decimals;
  console.log(`Withdrawable amount: ${withdrawableUiAmount}`);

  // The only way to get the current APY is to fetch it from the keeper API
  const apy = await getVaultApy(vaultImpl.vaultState.tokenMint);
  console.log(`APY: ${apy}%`);

  // Lending that the vault deposited to. This retrieve the info from onchain. User can get it from API https://merv2-api.meteora.ag/vault_state as well.
  const strategyAddresses = vaultImpl.vaultState.strategies.filter(
    (s) => !s.equals(PublicKey.default)
  );

  const strategyAccounts = await connection.getMultipleAccountsInfo(
    strategyAddresses
  );

  const strategyReserveLiquidityMap = new Map<string, number>();

  for (const strategy of strategyAccounts) {
    if (!strategy) {
      continue;
    }

    // TODO: Fix the SDK
    const reserveBytes = strategy.data.slice(8, 8 + 32);
    const reserveAddress = new PublicKey(reserveBytes);

    const liquidityBytes = strategy.data.slice(8 + 32 + 32 + 1, 8);
    const liquidity = new BN(liquidityBytes, "le");

    const liquidityAmount = liquidity.toNumber() / 10 ** mintState.decimals;
    strategyReserveLiquidityMap.set(
      reserveAddress.toBase58(),
      liquidityAmount
    );
  }

  const reserveAddresses = Array.from(strategyReserveLiquidityMap.keys());

  const reserveAccounts = await connection.getMultipleAccountsInfo(
    reserveAddresses.map((addr) => new PublicKey(addr))
  );

  const strategyAllocation = [];
  for (let i = 0; i < reserveAddresses.length; i++) {
    const reserveAddress = reserveAddresses[i];
    const reserveAccount = reserveAccounts[i];
    const liquidity = strategyReserveLiquidityMap.get(reserveAddress) || 0;

    console.log(`Reserve: ${reserveAddress}`);
    console.log(`Liquidity: ${liquidity}`);
    console.log(
      `Lending Program: ${
        lendingProgramIdsToName.get(reserveAccount?.owner.toBase58() || '') ||
        "Unknown"
      }`
    );

    strategyAllocation.push({
      name: lendingProgramIdsToName.get(reserveAccount?.owner.toBase58() || '') || "Unknown",
      liquidity: liquidity,
      allocation: ((liquidity / vaultTotalUiAmount) * 100).toFixed(0),
      maxAllocation: 0, // This would need to come from API if needed
    });
  }

  // Add vault reserves to strategy allocation
  const vaultReservesAmount = withdrawableUiAmount;
  strategyAllocation.push({
    name: 'Vault Reserves',
    liquidity: vaultReservesAmount,
    allocation: ((vaultReservesAmount / vaultTotalUiAmount) * 100).toFixed(0),
    maxAllocation: 0,
  });

  // Sort by liquidity descending
  strategyAllocation.sort((a: any, b: any) => b.liquidity - a.liquidity);

  return {
    lpSupply: lpMintSupply.toString(),
    withdrawableAmount: withdrawableUiAmount,
    virtualPrice,
    closest_apy: apy, // From API
    totalAmount: vaultTotalUiAmount,
    tokenMint: vaultImpl.vaultState.tokenMint.toBase58(),
    vaultAddress: vaultImpl.vaultPda.toBase58(),
    strategyAllocation,
  };
}



/**
 * Get vault instance for a specific token mint
 * @param tokenMint - Token mint address
 * @returns VaultImpl instance
 */
const getVault = async (tokenMint: PublicKey) => {
  return await VaultImpl.create(connection, tokenMint, { cluster: 'devnet' });
};

/**
 * Get vault instance for SOL token
 * @returns VaultImpl instance for SOL
 */
export const getSolVault = async (): Promise<VaultImpl> => {
  return await getVault(new PublicKey(SUPPORTED_TOKENS.SOL));
};

/**
 * Get vault instance for USDC token  
 * @returns VaultImpl instance for USDC
 */
export const getUsdcVault = async (): Promise<VaultImpl> => {
  return await getVault(new PublicKey(SUPPORTED_TOKENS.USDC));
};

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
    console.log('Token map resolved:', tokenMap.length);
    
    // Get token info for all supported tokens
    const SOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'SOL') as TokenInfo;
    const USDC_TOKEN_INFO = tokenMap.find(token => token.symbol === 'USDC-Dev') as TokenInfo;

    if (!SOL_TOKEN_INFO) {
      throw new Error('SOL token not found in token registry');
    }
    if (!USDC_TOKEN_INFO) {
      throw new Error('USDC token not found in token registry');
    }

    // Create vaults for supported tokens with categories
    const vaultConfigs = [
      { 
        token: SOL_TOKEN_INFO, 
        name: "Boosted SOL Vault", 
        symbol: "SOL", 
        baseDescription: 'Earn yield on your SOL with dynamic strategies',
        category: TOKEN_CATEGORIES.LSTS
      },
      { 
        token: USDC_TOKEN_INFO, 
        name: "Boosted USDC Vault", 
        symbol: "USDC", 
        baseDescription: 'Earn yield on your USDC with dynamic strategies',
        category: TOKEN_CATEGORIES.STABLES
      }
    ];

    for (const vaultConfig of vaultConfigs) {
      try {
        console.log(`Creating vault for ${vaultConfig.symbol}...`);
        const vault: VaultImpl = await VaultImpl.create(
          connection,
          new PublicKey(vaultConfig.token.address),
          { cluster: 'devnet' }
        );

        console.log(`Vault created successfully for ${vaultConfig.symbol}:`, !!vault);

        // Get real vault details instead of hardcoded values
        console.log(`Fetching real vault details for ${vaultConfig.symbol}...`);
        
        let vaultDetails;
        let description = vaultConfig.baseDescription;
        let apy = 0;
        let totalValueLocked = 0;
        let withdrawableAmount = 0;
        let virtualPrice = 0;
        
        try {
          vaultDetails = await getVaultDetails(vault, vaultConfig.token.address);
          description = `${vaultConfig.baseDescription} (Current APY: ${vaultDetails.closest_apy}%)`;
          apy = vaultDetails.closest_apy;
          totalValueLocked = vaultDetails.totalAmount;
          withdrawableAmount = vaultDetails.withdrawableAmount;
          virtualPrice = vaultDetails.virtualPrice;
        } catch (detailsError) {
          console.warn(`Failed to fetch vault details for ${vaultConfig.symbol}, using fallback values:`, detailsError);
          // Fallback to basic description without APY
          description = vaultConfig.baseDescription;
        }

        vaults.push({
          vault: vault,
          name: vaultConfig.name,
          tokenSymbol: vaultConfig.symbol,
          description: description,
          apy: apy, // Real APY from keeper API or 0 as fallback
          totalValueLocked: totalValueLocked, // Real TVL or 0 as fallback
          withdrawableAmount: withdrawableAmount, // Real withdrawable amount or 0 as fallback
          virtualPrice: virtualPrice, // Real virtual price or 0 as fallback
          category: vaultConfig.category,
        });
      } catch (error) {
        console.error(`Failed to create vault for ${vaultConfig.symbol}:`, error);
        // Continue with other vaults even if one fails
      }
    }

    return vaults;
  } catch (error) {
    console.error('Error loading vaults:', error);
    throw new Error('Failed to load available vaults');
  }
};

/**
 * Get user's balance in a specific vault
 * @param userPublicKey - User's public key
 * @param vaultType - Type of vault ('SOL', 'USDC')
 * @returns Object containing user's withdrawable amount from the vault
 */
export const getUserVaultBalance = async (userPublicKey: PublicKey, vaultType: string = 'SOL') => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    let tokenInfo: TokenInfo;
    
    switch (vaultType.toUpperCase()) {
      case 'USDC':
        tokenInfo = tokenMap.find(token => token.symbol === 'USDC-Dev') as TokenInfo;
        break;
      case 'SOL':
      default:
        tokenInfo = tokenMap.find(token => token.symbol === 'SOL') as TokenInfo;
        break;
    }
    
    if (!tokenInfo) {
      throw new Error(`${vaultType} token not found in token registry`);
    }
    
    const vault = await getVault(new PublicKey(tokenInfo.address));
    
    // Get user's LP token balance in the vault
    const userLpBalance = await vault.getUserBalance(userPublicKey);
    
    // Calculate withdrawable amount based on LP balance
    const vaultSupply = await vault.getVaultSupply();
    const totalWithdrawableAmount = await vault.getWithdrawableAmount();
    
    // Calculate user's share: (user LP balance / total LP supply) * total withdrawable amount
    const userWithdrawableAmount = vaultSupply.isZero() 
      ? new BN(0)
      : userLpBalance.mul(totalWithdrawableAmount).div(vaultSupply);
    
    // Convert to appropriate units based on token decimals
    const decimals = tokenInfo.decimals || 9;
    const divisor = Math.pow(10, decimals);
    
    return {
      userLpBalance: userLpBalance.toNumber() / divisor,
      withdrawableAmount: userWithdrawableAmount.toNumber() / divisor,
      hasBalance: !userLpBalance.isZero(),
      vaultType: vaultType
    };
  } catch (error) {
    console.error(`Error getting user ${vaultType} vault balance:`, error);
    return {
      userLpBalance: 0,
      withdrawableAmount: 0,
      hasBalance: false,
      vaultType: vaultType
    };
  }
};

/**
 * Deposit tokens into Meteora vault.
 * @param signAndSendTransaction - Function to sign and send transaction
 * @param publicKey - User's public key
 * @param amount - Amount in tokens (not smallest unit), e.g. 0.01 for 0.01 SOL
 * @param vaultType - Type of vault ('SOL', 'USDC')
 * @returns transaction signature string
 */
export const depositToVault = async (
  publicKey: PublicKey,
  amount: number,
  vaultType: string = 'SOL'
): Promise<any> => {
  try {
    console.log('Starting vault deposit process...');
    console.log('Deposit amount:', amount);
    console.log('Vault type:', vaultType);
    console.log('Public key:', publicKey.toString());
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid deposit amount. Amount must be greater than 0.');
    }

    // Get token info based on vault type
    console.log('Resolving token list...');
    let tokenMap, tokenInfo;
    try {
      tokenMap = new StaticTokenListResolutionStrategy().resolve();
      
      switch (vaultType.toUpperCase()) {
        case 'USDC':
          tokenInfo = tokenMap.find(token => token.symbol === 'USDC-Dev');
          break;
        case 'SOL':
        default:
          tokenInfo = tokenMap.find(token => token.symbol === 'SOL');
          break;
      }

      if (!tokenInfo) {
        throw new Error(`${vaultType} token info not found in token registry`);
      }

      console.log(`${vaultType} token address:`, tokenInfo.address);
    } catch (tokenError: any) {
      console.error('Token resolution failed:', tokenError);
      throw new Error(`Failed to resolve ${vaultType} token info: ${tokenError?.message || 'Unknown token error'}`);
    }

    // Check user's balance for the specific token
    console.log('Checking user balance...');
    let balance, balanceInTokens;
    try {
      if (vaultType.toUpperCase() === 'SOL') {
        // For SOL, check native balance
        balance = await connection.getBalance(publicKey);
        balanceInTokens = balance / 10**9;
        console.log('User SOL balance:', balanceInTokens);
        
        if (balanceInTokens < amount + 0.01) { // Need extra for transaction fees
          throw new Error(`Insufficient SOL balance. You have ${balanceInTokens.toFixed(4)} SOL but need ${amount + 0.01} SOL (including fees).`);
        }
      } else {
        // For other tokens, you would need to check token balance
        // This is a simplified version - in production you'd check the actual token balance
        console.log(`Balance check for ${vaultType} tokens not implemented yet`);
      }
    } catch (balanceError: any) {
      console.error('Balance check failed:', balanceError);
      throw new Error(`Failed to check balance: ${balanceError?.message || 'Network connection failed'}`);
    }

    // Create vault instance
    console.log(`Creating vault instance for ${vaultType}...`);
    console.log('Using token address:', tokenInfo.address);
    
    let vault;
    try {
      vault = await getVault(new PublicKey(tokenInfo.address));
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

    // Calculate deposit amount in smallest units based on token decimals
    const decimals = tokenInfo.decimals || 9;
    const depositAmount = new BN(Math.floor(amount * Math.pow(10, decimals)));
    console.log('Deposit amount in smallest units:', depositAmount.toString());
    
    if (depositAmount.isZero()) {
      throw new Error(`Deposit amount too small. Minimum deposit is ${1 / Math.pow(10, decimals)} ${vaultType}.`);
    }
    
    const depositTx = await vault.deposit(publicKey, depositAmount);
    console.log('Deposit transaction built successfully');
    
    return {
      transaction: depositTx,
      minContextSlot: await connection.getSlot()
    };

  } catch (error: any) {
    console.log('Detailed error in depositToVault:', error);
    throw error;
  }
};

/**
 * Filter and log tokens with SOL or USD in their symbol or name
 * This function will test creating VaultImpl instances for each token and only log successful ones
 */
export const logSolUsdTokens = async (): Promise<void> => {
  try {
    console.log('Starting token filtering and vault testing process...');
    
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    console.log('Total tokens in registry:', tokenMap.length);
    
    // Filter tokens that contain SOL or USD in symbol or name
    const filteredTokens = tokenMap.filter(token => {
      const symbol = token.symbol?.toUpperCase() || '';
      const name = token.name?.toUpperCase() || '';
      return symbol.includes('SOL') || symbol.includes('USD') || 
             name.includes('SOL') || name.includes('USD');
    });
    
    console.log(`Found ${filteredTokens.length} tokens with SOL or USD in symbol/name`);
    console.log('Testing VaultImpl creation for each token...\n');
    
    const successfulVaults: any[] = [];
    const failedVaults: any[] = [];
    
    // Test creating VaultImpl for each token
    for (let i = 0; i < filteredTokens.length; i++) {
      const token = filteredTokens[i];
      console.log(`Testing ${i + 1}/${filteredTokens.length}: ${token.symbol} (${token.name})`);
      
      try {
        const vault = await VaultImpl.create(
          connection,
          new PublicKey(token.address),
          { cluster: 'devnet' }
        );
        
        // If we get here, the vault was created successfully
        successfulVaults.push({
          token,
          vault,
          index: i + 1
        });
        
        console.log(`✅ SUCCESS: ${token.symbol} (${token.name}) - ${token.address}`);
        
        // Try to get some basic vault info to verify it's working
        try {
          const supply = await vault.getVaultSupply();
          const withdrawable = await vault.getWithdrawableAmount();
          console.log(`   Vault Supply: ${supply.toString()}`);
          console.log(`   Withdrawable Amount: ${withdrawable.toString()}`);
        } catch (infoError) {
          console.log(`   ⚠️  Vault created but couldn't get basic info: ${infoError}`);
        }
        
      } catch (vaultError: any) {
        failedVaults.push({
          token,
          error: vaultError.message || 'Unknown error',
          index: i + 1
        });
        console.log(`❌ FAILED: ${token.symbol} (${token.name}) - ${vaultError.message || 'Unknown error'}`);
      }
      
      console.log('---');
    }
    
    // Log summary of successful vaults
    console.log('\n=== SUCCESSFUL VAULTS SUMMARY ===');
    console.log(`Generated on: ${new Date().toISOString()}`);
    console.log(`Total tokens tested: ${filteredTokens.length}`);
    console.log(`Successful vaults: ${successfulVaults.length}`);
    console.log(`Failed vaults: ${failedVaults.length}`);
    console.log(`Success rate: ${((successfulVaults.length / filteredTokens.length) * 100).toFixed(2)}%\n`);
    
    if (successfulVaults.length > 0) {
      console.log('=== SUCCESSFUL VAULTS DETAILS ===');
      successfulVaults.forEach((item, index) => {
        const token = item.token;
        console.log(`${index + 1}. Token Details:`);
        console.log(`   Symbol: ${token.symbol || 'N/A'}`);
        console.log(`   Name: ${token.name || 'N/A'}`);
        console.log(`   Address: ${token.address}`);
        console.log(`   Decimals: ${token.decimals || 'N/A'}`);
        console.log(`   Logo URI: ${token.logoURI || 'N/A'}`);
        console.log(`   Tags: ${token.tags?.join(', ') || 'N/A'}`);
        console.log(`   Extensions: ${JSON.stringify(token.extensions || {})}`);
        console.log('   ---');
      });
    }
    
    if (failedVaults.length > 0) {
      console.log('\n=== FAILED VAULTS SUMMARY ===');
      failedVaults.forEach((item, index) => {
        const token = item.token;
        console.log(`${index + 1}. ${token.symbol} (${token.name})`);
        console.log(`   Address: ${token.address}`);
        console.log(`   Error: ${item.error}`);
        console.log('   ---');
      });
    }
    
    console.log('\n=== FINAL SUMMARY ===');
    console.log(`- Total tokens in registry: ${tokenMap.length}`);
    console.log(`- Tokens with SOL/USD in symbol/name: ${filteredTokens.length}`);
    console.log(`- Successful vaults: ${successfulVaults.length}`);
    console.log(`- Failed vaults: ${failedVaults.length}`);
    console.log(`- Success rate: ${((successfulVaults.length / filteredTokens.length) * 100).toFixed(2)}%`);
    console.log('=== END ANALYSIS ===\n');
    
  } catch (error) {
    console.error('Error in logSolUsdTokens:', error);
    throw new Error('Failed to analyze and test vaults');
  }
};

/**
 * Get a list of all available tokens for review
 * @returns Array of token information
 */
export const getAllTokens = (): TokenInfo[] => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    return tokenMap;
  } catch (error) {
    console.error('Error getting all tokens:', error);
    return [];
  }
};

/**
 * Get tokens by symbol pattern (case-insensitive)
 * @param pattern - Pattern to search for in token symbol
 * @returns Array of matching tokens
 */
export const getTokensBySymbol = (pattern: string): TokenInfo[] => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    const upperPattern = pattern.toUpperCase();
    
    return tokenMap.filter(token => 
      token.symbol?.toUpperCase().includes(upperPattern)
    );
  } catch (error) {
    console.error('Error getting tokens by symbol:', error);
    return [];
  }
};

/**
 * Get all tokens that contain SOL or USD in their symbol or name
 * @returns Array of tokens with SOL or USD in symbol/name
 */
export const getSolUsdTokens = (): TokenInfo[] => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    
    return tokenMap.filter(token => {
      const symbol = token.symbol?.toUpperCase() || '';
      const name = token.name?.toUpperCase() || '';
      return symbol.includes('SOL') || symbol.includes('USD') || 
             name.includes('SOL') || name.includes('USD');
    });
  } catch (error) {
    console.error('Error getting SOL/USD tokens:', error);
    return [];
  }
};

