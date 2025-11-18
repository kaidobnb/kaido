import { parseEther, formatEther, type Address } from 'viem';

// Fee wallet address to receive transaction fees
export const FEE_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

// Fee percentage (0.25%)
export const FEE_PERCENTAGE = 0.0025;

// Minimum fee amount in BNB to avoid gas issues
export const MIN_FEE_AMOUNT = 0.001;

/**
 * Create a transaction for sending BNB to any address with a fee
 * @param senderAddress The sender's address
 * @param recipientAddress The recipient's address
 * @param amount The amount to send in BNB
 * @returns A transaction object
 */
export const createBnbTransferTransaction = async (
  senderPublicKey: PublicKey,
  recipientAddress: string,
  amount: number,
  connection: any
): Promise<Transaction> => {
  try {
    console.log('Creating SOL transfer transaction with fee...');
    console.log('Sender public key:', senderPublicKey.toString());
    console.log('Recipient address:', recipientAddress);
    console.log('Total amount:', amount);

    // Calculate fee amount (0.25% of the total amount)
    let feeAmount = amount * FEE_PERCENTAGE;
    console.log('Calculated 0.25% fee:', feeAmount, 'SOL');

    // The threshold where 0.25% fee equals 0.001 SOL is 0.4 SOL
    // For amounts less than 0.4 SOL, we'll use the minimum fee
    // For amounts 0.4 SOL or more, we'll use the calculated percentage fee

    // Ensure the fee amount is at least 0.001 SOL to avoid rent-exemption issues
    // This is the minimum amount needed to avoid "insufficient funds for rent" errors
    if (feeAmount < MIN_FEE_AMOUNT && amount > MIN_FEE_AMOUNT) {
      console.log('Fee below minimum, using minimum fee of', MIN_FEE_AMOUNT, 'SOL');
      feeAmount = MIN_FEE_AMOUNT;
    } else {
      console.log('Using calculated 0.25% fee:', feeAmount, 'SOL');
    }

    console.log('Final fee amount:', feeAmount, 'SOL');

    // Calculate recipient amount (total amount minus fee)
    const recipientAmount = amount - feeAmount;
    console.log('Recipient amount:', recipientAmount, 'SOL');

    // Convert SOL to lamports
    const recipientLamports = Math.floor(recipientAmount * LAMPORTS_PER_SOL);
    const feeLamports = Math.floor(feeAmount * LAMPORTS_PER_SOL);

    // Create a new transaction
    const transaction = new Transaction();

    // Create a transfer instruction for the recipient
    const recipientTransferInstruction = SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports: recipientLamports
    });

    // Create a transfer instruction for the fee
    const feeTransferInstruction = SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: new PublicKey(FEE_WALLET_ADDRESS),
      lamports: feeLamports
    });

    // Add both instructions to the transaction
    transaction.add(recipientTransferInstruction);
    transaction.add(feeTransferInstruction);

    // Set the fee payer
    transaction.feePayer = senderPublicKey;

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    console.log('SOL transfer transaction with fee created successfully');
    return transaction;
  } catch (error) {
    console.error('Error creating SOL transfer transaction with fee:', error);
    throw error;
  }
};
