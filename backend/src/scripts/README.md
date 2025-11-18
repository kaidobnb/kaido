# SolyMarket Scripts

This directory contains scripts for database migrations, maintenance, and data generation.

## Generate Predictions Script

The `generatePredictions.ts` script creates realistic crypto price predictions with balanced participation from fake users. This is useful for populating the platform with activity when it's new.

### Features

- Creates 10 predictions for different crypto assets
- Sets expiry dates within one week from execution
- Generates target prices that are reasonably close to current prices
- Creates fake users to participate in predictions
- Balances the volume between YES and NO positions

### How to run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure your MongoDB connection is configured in your `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/solymarket
   ```

3. Run the script:
   ```bash
   npm run generate-predictions
   ```

## Drop Unique Index Script

The `dropUniqueIndex.js` script removes the unique index on the participations collection that prevents users from participating multiple times with the same position.

### Why is this needed?

We've updated the Participation model to allow users to participate multiple times with the same position, but MongoDB doesn't automatically update existing indexes when you change the schema. This script drops the existing unique index and creates a new non-unique index.

### How to run

1. Make sure MongoDB is running and accessible
2. Navigate to the backend directory
3. Run the script:

```bash
node src/scripts/dropUniqueIndex.js
```

### Expected output

```
Connecting to MongoDB...
Connected to MongoDB
Current indexes: [...]
Found unique index: user_1_prediction_1_position_1
Successfully dropped the unique index
Created new non-unique index
Disconnected from MongoDB
Index migration completed successfully
```

## Temporary Workaround

Until the index is dropped, the system will automatically handle duplicate key errors by updating the existing participation record instead of creating a new one. This ensures users can still participate multiple times with the same position even before the index is dropped.

## Customizing the Generate Predictions Script

You can modify the `generatePredictions.ts` script to change:

- **Number of assets**: Change the slice in `selectedAssets` to include more or fewer assets
- **Number of fake users**: Modify the count parameter in `generateFakeUsers(5)`
- **Target price range**: Adjust the percentage range in `generateTargetPrice()` function
- **Volume range**: Change the min/max values in `totalVolume` calculation
- **Expiry date range**: Modify the days range in `getRandomExpiryDate()`

Example to generate more predictions with higher volume:

```typescript
// Select 15 assets instead of 10
const selectedAssets = SUPPORTED_TOKENS
  .map(token => token.symbol)
  .slice(0, 15);

// Generate 10 fake users instead of 5
const fakeUsers = await generateFakeUsers(10);

// In generateBalancedParticipation function:
// Increase volume range to 1-5 SOL
const totalVolume = faker.number.float({ min: 1, max: 5, precision: 0.01 });
```
