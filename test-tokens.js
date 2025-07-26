// Test script to filter and log SOL/USD tokens with VaultImpl testing
// Run with: node test-tokens.js

const { StaticTokenListResolutionStrategy } = require('@solana/spl-token-registry');
const { Connection, PublicKey } = require('@solana/web3.js');
const VaultImpl = require('@meteora-ag/vault-sdk').default;

// Set up devnet connection
const DEVNET_RPC = 'https://api.devnet.solana.com/';
const connection = new Connection(DEVNET_RPC, { commitment: 'confirmed' });

/**
 * Filter and log tokens with SOL or USD in their symbol or name
 * This function will test creating VaultImpl instances for each token and only log successful ones
 */
async function logSolUsdTokens() {
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
    
    const successfulVaults = [];
    const failedVaults = [];
    
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
          console.log(`   ⚠️  Vault created but couldn't get basic info: ${infoError.message}`);
        }
        
      } catch (vaultError) {
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
    
    // Detailed logging of all successful vaults and their information
    console.log('\n=== DETAILED SUCCESSFUL VAULTS INFORMATION ===');
    console.log(`Generated on: ${new Date().toISOString()}`);
    console.log(`Total successful vaults: ${successfulVaults.length}\n`);
    
    for (let i = 0; i < successfulVaults.length; i++) {
      const item = successfulVaults[i];
      const token = item.token;
      const vault = item.vault;
      
      console.log(`\n${i + 1}. VAULT: ${token.symbol} (${token.name})`);
      console.log('='.repeat(50));
      
      // Token Information
      console.log('TOKEN INFORMATION:');
      console.log(`  Symbol: ${token.symbol || 'N/A'}`);
      console.log(`  Name: ${token.name || 'N/A'}`);
      console.log(`  Address: ${token.address}`);
      console.log(`  Decimals: ${token.decimals || 'N/A'}`);
      console.log(`  Logo URI: ${token.logoURI || 'N/A'}`);
      console.log(`  Tags: ${token.tags?.join(', ') || 'N/A'}`);
      console.log(`  Extensions: ${JSON.stringify(token.extensions || {})}`);
      
      // Vault Information
      console.log('\nVAULT INFORMATION:');
      try {
        const supply = await vault.getVaultSupply();
        console.log(`  Vault Supply: ${supply.toString()}`);
      } catch (error) {
        console.log(`  Vault Supply: Error - ${error.message}`);
      }
      
      try {
        const withdrawable = await vault.getWithdrawableAmount();
        console.log(`  Withdrawable Amount: ${withdrawable.toString()}`);
      } catch (error) {
        console.log(`  Withdrawable Amount: Error - ${error.message}`);
      }
      
      try {
        const vaultState = await vault.getVaultState();
        console.log(`  Vault State: ${JSON.stringify(vaultState, null, 2)}`);
      } catch (error) {
        console.log(`  Vault State: Error - ${error.message}`);
      }
      
      try {
        const vaultInfo = await vault.getVaultInfo();
        console.log(`  Vault Info: ${JSON.stringify(vaultInfo, null, 2)}`);
      } catch (error) {
        console.log(`  Vault Info: Error - ${error.message}`);
      }
      
      try {
        const vaultAuthority = await vault.getVaultAuthority();
        console.log(`  Vault Authority: ${vaultAuthority?.toString() || 'N/A'}`);
      } catch (error) {
        console.log(`  Vault Authority: Error - ${error.message}`);
      }
      
      try {
        const tokenAccount = await vault.getTokenAccount();
        console.log(`  Token Account: ${tokenAccount?.toString() || 'N/A'}`);
      } catch (error) {
        console.log(`  Token Account: Error - ${error.message}`);
      }
      
      try {
        const feeAccount = await vault.getFeeAccount();
        console.log(`  Fee Account: ${feeAccount?.toString() || 'N/A'}`);
      } catch (error) {
        console.log(`  Fee Account: Error - ${error.message}`);
      }
      
      console.log('='.repeat(50));
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
}

// Run the function
logSolUsdTokens().catch(console.error); 