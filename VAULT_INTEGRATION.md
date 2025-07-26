# Meteora Vault Integration

This React Native app now includes integration with Meteora Vault SDK for depositing tokens into vaults on Solana devnet.

## Features

- **Vault Discovery**: Browse available Meteora vaults on devnet
- **Wallet Integration**: Connect your Solana mobile wallet to deposit
- **Deposit Interface**: User-friendly modal for entering deposit amounts
- **Transaction Signing**: Secure transaction signing through mobile wallet adapter

## How to Use

### 1. Connect Your Wallet
- Open the app and navigate to the "Home" tab
- Connect your Solana mobile wallet (e.g., Phantom, Solflare)
- Ensure you're connected to devnet

### 2. Browse Vaults
- Navigate to the "Vaults" tab
- View available Meteora vaults with their details:
  - Vault name and description
  - Token symbol and decimals
  - Total Value Locked (TVL)
  - Annual Percentage Yield (APY)

### 3. Deposit to Vaults
- Tap the "Deposit" button on any vault
- Enter the amount you want to deposit
- Confirm the transaction in your wallet
- View transaction confirmation and signature

## Technical Implementation

### Key Components

1. **VaultService** (`src/utils/vaultService.ts`)
   - Handles all vault-related operations
   - Integrates with Meteora Vault SDK
   - Manages transaction signing through mobile wallet adapter

2. **VaultsScreen** (`src/screens/VaultsScreen.tsx`)
   - Main UI for browsing and interacting with vaults
   - Displays vault information and statistics
   - Handles deposit flow

3. **DepositModal** (`src/components/vault/DepositModal.tsx`)
   - Modal interface for entering deposit amounts
   - Validates input and handles deposit confirmation

### Network Configuration

The app is configured to use **Solana devnet** for vault operations:
- Connection endpoint: `https://api.devnet.solana.com`
- Meteora SDK network: `devnet`
- All vault operations are performed on devnet

### Dependencies

- `@meteora-ag/vault-sdk`: Meteora Vault SDK for vault operations
- `@solana/web3.js`: Solana Web3.js for blockchain interactions
- `@solana-mobile/mobile-wallet-adapter-protocol`: Mobile wallet integration

## Development Notes

### Testing on Devnet
- Use Solana CLI to airdrop devnet SOL: `solana airdrop 2 <your-address> --url devnet`
- Ensure your wallet is connected to devnet
- Test with small amounts first

### Error Handling
- Network errors are caught and displayed to users
- Transaction failures show appropriate error messages
- Wallet connection issues are handled gracefully

### Future Enhancements
- Withdraw functionality
- User vault balance tracking
- Historical transaction viewing
- APY calculation and display
- Token balance checking before deposits

## Troubleshooting

### Common Issues

1. **"No vaults available"**
   - Check network connection
   - Ensure you're on devnet
   - Try refreshing the vault list

2. **"Failed to deposit"**
   - Verify wallet has sufficient SOL for transaction fees
   - Check if you have the required tokens to deposit
   - Ensure wallet is properly connected

3. **"Please connect your wallet first"**
   - Navigate to Home tab and connect your wallet
   - Make sure wallet is connected to devnet

### Debug Information
- Check console logs for detailed error messages
- Transaction signatures are logged for debugging
- Network requests and responses are logged

## Security Considerations

- All transactions are signed locally through the mobile wallet
- Private keys never leave the wallet
- Transaction confirmation is required before execution
- Network validation ensures devnet-only operations 