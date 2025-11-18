# KAIDO LP Token Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Issue: Token showing extremely large numbers in wallet

**Problem**: Your wallet displays numbers like `1,000,000,000,000,000,000,000,000,000,000,000` instead of the correct balance.

**Cause**: The wallet is not correctly interpreting the token's 18 decimal places.

**Solutions**:

#### Solution 1: Re-add the token with correct settings
1. **Remove the existing token** from your wallet
2. **Clear wallet cache** (if possible in your wallet settings)
3. **Re-add the token** using our automated tool on the presale page
4. **Verify the decimals** are set to exactly **18**

#### Solution 2: Manual token addition
1. Open your wallet (MetaMask, Trust Wallet, etc.)
2. Go to "Add Token" or "Import Token"
3. Select "Custom Token" or "ERC-20"
4. Enter these **exact** details:
   - **Contract Address**: `0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5`
   - **Token Symbol**: `KAIDO`
   - **Decimals**: `18` (CRITICAL - must be exactly 18)
5. Click "Add Token"

#### Solution 3: Network verification
1. **Ensure you're on BNB Smart Chain Mainnet**
   - Chain ID: `56`
   - RPC URL: `https://bsc-dataseed.binance.org/`
   - Currency Symbol: `BNB`
   - Block Explorer: `https://bscscan.com/`

#### Solution 4: Wallet-specific fixes

**For MetaMask**:
1. Go to Settings → Advanced → Reset Account
2. Re-import your wallet
3. Re-add the KAIDO LP token

**For Trust Wallet**:
1. Go to Settings → Preferences → Reset
2. Re-add the token manually

**For other wallets**:
1. Clear app cache/data
2. Re-import wallet
3. Re-add token

### Issue: Token not showing up at all

**Solutions**:
1. **Check network**: Ensure you're on BNB Smart Chain Mainnet (Chain ID: 56)
2. **Verify contract address**: `0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5`
3. **Check if you have any balance**: Visit [BSCScan](https://bscscan.com/address/0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5) and search for your wallet address

### Issue: Wrong token symbol or name

**Expected values**:
- **Name**: Kaido LP
- **Symbol**: KAIDO
- **Decimals**: 18
- **Network**: BNB Smart Chain Mainnet

If these don't match, remove and re-add the token.

## 📋 Token Information

- **Contract Address**: `0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5`
- **Network**: BNB Smart Chain Mainnet
- **Chain ID**: 56
- **Token Name**: Kaido LP
- **Token Symbol**: KAIDO
- **Decimals**: 18
- **Total Supply**: 1,000,000,000 KAIDO
- **Presale Allocation**: 400,000,000 KAIDO (40%)

## 🔗 Useful Links

- **BSCScan Contract**: https://bscscan.com/address/0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5
- **Token Metadata**: https://kaidobnb.xyz/kaido-lp-metadata.json
- **Token Logo**: https://kaidobnb.xyz/kaido.png

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Double-check the contract address** - make sure it matches exactly
2. **Verify you're on the correct network** - BNB Smart Chain Mainnet only
3. **Try a different wallet** - sometimes switching wallets helps
4. **Contact support** - reach out to our team with:
   - Your wallet address
   - Screenshots of the issue
   - Which wallet you're using
   - What steps you've already tried

## ⚠️ Important Notes

- **Never share your private keys or seed phrase**
- **Always verify contract addresses** before adding tokens
- **The KAIDO LP token is only on BNB Smart Chain Mainnet**
- **Decimals must be exactly 18** for correct display
- **This is a presale token** that will be redeemed for the main KAIDO token later

## 🔍 How to Verify Your Balance

1. Go to [BSCScan](https://bscscan.com/token/0x9c34729D6C5dE59D85C7Edee2A378C6E916044a5)
2. Click on "Holders" tab
3. Search for your wallet address
4. Your balance should show the correct amount with 18 decimal places

Example: If you see `1000000000000000000000` on BSCScan, that equals `1000` KAIDO tokens (divide by 10^18).
