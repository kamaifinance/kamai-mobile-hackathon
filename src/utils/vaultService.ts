import { Connection, PublicKey, Transaction, VersionedTransaction, TransactionSignature, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import VaultImpl, { KEEPER_URL, } from '@meteora-ag/vault-sdk';
import { BN } from 'bn.js';
import { StaticTokenListResolutionStrategy, TokenInfo } from '@solana/spl-token-registry';
// 1. Set up devnet connection
const DEVNET_RPC = 'https://api.devnet.solana.com/';
const connection = new Connection(DEVNET_RPC, { commitment: 'confirmed' })

// Token addresses for supported vaults
const SUPPORTED_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  MSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  USDC_DEV: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
};

// Get on-chain data from the vault and off-chain data from the api
export const getVaultDetails = async (vaultImpl: VaultImpl, tokenAddress?: string) => {
  //Get the total unlocked amount in vault that is withdrawable by users
  const vaultUnlockedAmount = (await vaultImpl.getWithdrawableAmount()).toNumber();

  const tokenMap = new StaticTokenListResolutionStrategy().resolve();
  let tokenInfo: TokenInfo | undefined;
  if (tokenAddress) {
    tokenInfo = tokenMap.find(token => token.address === tokenAddress);
  } else {
    // fallback to SOL if not provided
    tokenInfo = tokenMap.find(token => token.symbol === 'SOL');
  }
  if (!tokenInfo) {
    throw new Error('Token info not found for the provided address');
  }

  //Calculate virtual price using the vault's unlocked amount and lp supply
  const virtualPrice = (vaultUnlockedAmount / (await vaultImpl.getVaultSupply()).toNumber()) || 0;

  // Get the off-chain data from API
  let vaultStateAPI: any;
  try {
    const URL = KEEPER_URL['devnet'];
    console.log(KEEPER_URL)
    console.log('Fetching vault state API for:', tokenInfo.address, 'with URL:', `${URL}/vault_state/${tokenInfo.address}`);
    const response = await fetch(`${URL}/vault_state/${tokenInfo.address}`);
    vaultStateAPI = await response.json();
  } catch (error) {
    console.error('Failed to fetch vault state API:', error);
    throw new Error('Failed to fetch vault state API');
  }
  
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
 * Get vault instance for mSOL token
 * @returns VaultImpl instance for mSOL
 */
export const getMsolVault = async (): Promise<VaultImpl> => {
  return await getVault(new PublicKey(SUPPORTED_TOKENS.MSOL));
};



/**
 * Get vault instance for USDC-Dev token
 * @returns VaultImpl instance for USDC-Dev
 */
export const getUsdcDevVault = async (): Promise<VaultImpl> => {
  return await getVault(new PublicKey(SUPPORTED_TOKENS.USDC_DEV));
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
    const MSOL_TOKEN_INFO = tokenMap.find(token => token.symbol === 'mSOL') as TokenInfo;
    const USDC_DEV_TOKEN_INFO = tokenMap.find(token => token.symbol === 'USDC-Dev') as TokenInfo;

    if (!SOL_TOKEN_INFO) {
      throw new Error('SOL token not found in token registry');
    }

    // Create vaults for all supported tokens
    const vaultPromises = [
      { token: SOL_TOKEN_INFO, name: "Boosted SOL Vault", symbol: "SOL", description: 'Earn yield on your SOL with dynamic strategies', apy: 8.5 },
      { token: MSOL_TOKEN_INFO, name: "Boosted mSOL Vault", symbol: "mSOL", description: 'Earn yield on your mSOL with dynamic strategies', apy: 7.2 },
      { token: USDC_DEV_TOKEN_INFO, name: "Boosted USDC-Dev Vault", symbol: "USDC-Dev", description: 'Earn yield on your USDC-Dev with dynamic strategies', apy: 6.5 }
    ];

    for (const vaultConfig of vaultPromises) {
      try {
        console.log(`Creating vault for ${vaultConfig.symbol}...`);
        const vault: VaultImpl = await VaultImpl.create(
          connection,
          new PublicKey(vaultConfig.token.address),
          { cluster: 'devnet' }
        );

        console.log(`Vault created successfully for ${vaultConfig.symbol}:`, !!vault);

        vaults.push({
          vault: vault,
          name: vaultConfig.name,
          tokenSymbol: vaultConfig.symbol,
          description: vaultConfig.description,
          apy: vaultConfig.apy,
          totalValueLocked: 1234567.89, // Example TVL
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
 * @param vaultType - Type of vault ('SOL', 'mSOL', 'USDC', 'USDC-Dev')
 * @returns Object containing user's withdrawable amount from the vault
 */
export const getUserVaultBalance = async (userPublicKey: PublicKey, vaultType: string = 'SOL') => {
  try {
    const tokenMap = new StaticTokenListResolutionStrategy().resolve();
    let tokenInfo: TokenInfo;
    
    switch (vaultType.toUpperCase()) {
      case 'MSOL':
        tokenInfo = tokenMap.find(token => token.symbol === 'mSOL') as TokenInfo;
        break;
      case 'USDC-DEV':
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
 * @param vaultType - Type of vault ('SOL', 'mSOL', 'USDC', 'USDC-Dev')
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
        case 'MSOL':
          tokenInfo = tokenMap.find(token => token.symbol === 'mSOL');
          break;
        case 'USDC-DEV':
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

