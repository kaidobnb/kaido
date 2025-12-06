import { OracleService } from '../services/OracleService';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Example: Verify Election Result
 * 
 * This example shows how to use the Oracle to verify an election result
 * by scraping multiple trusted news sources and using AI to extract
 * structured data.
 */

async function verifyElectionResult() {
  const oracle = new OracleService(process.env.OPENAI_API_KEY!);

  try {
    console.log('🗳️  Starting election result verification...\n');

    const result = await oracle.verifyEvent({
      predictionId: '507f1f77bcf86cd799439011', // Example prediction ID
      eventType: 'election_result',
      claim: 'Donald Trump won the 2024 US Presidential Election',
      
      // Define the schema for data extraction
      schema: {
        description: 'Extract information about the 2024 US Presidential Election winner',
        fields: {
          winner: {
            type: 'string',
            description: 'Full name of the winning candidate'
          },
          party: {
            type: 'string',
            description: 'Political party of the winner (Republican, Democrat, etc.)'
          },
          electoralVotes: {
            type: 'number',
            description: 'Number of electoral votes received by the winner'
          },
          popularVotePercentage: {
            type: 'number',
            description: 'Percentage of popular vote received (0-100)'
          },
          declaredDate: {
            type: 'string',
            description: 'Date when the winner was officially declared (ISO format)'
          }
        }
      },
      
      // Verification thresholds
      minimumSources: 3,        // Require at least 3 sources
      minimumConfidence: 75,    // AI must be at least 75% confident
      minimumAgreement: 66      // At least 66% of sources must agree
    });

    console.log('\n📊 Verification Result:');
    console.log('─'.repeat(50));
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Verified: ${result.verified ? '✅' : '❌'}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Proof ID: ${result.proofId}`);

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    // Cleanup
    await oracle.cleanup();

    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await oracle.cleanup();
    throw error;
  }
}

/**
 * Example: Verify Movie Award
 */
async function verifyMovieAward() {
  const oracle = new OracleService(process.env.OPENAI_API_KEY!);

  try {
    console.log('🎬 Starting movie award verification...\n');

    const result = await oracle.verifyEvent({
      predictionId: '507f1f77bcf86cd799439012',
      eventType: 'movie_award',
      claim: 'Oppenheimer won Best Picture at the 2024 Oscars',
      
      schema: {
        description: 'Extract information about the 2024 Academy Awards Best Picture winner',
        fields: {
          movieTitle: {
            type: 'string',
            description: 'Title of the winning movie'
          },
          director: {
            type: 'string',
            description: 'Name of the director'
          },
          awardName: {
            type: 'string',
            description: 'Full name of the award (e.g., "Academy Award for Best Picture")'
          },
          ceremonyDate: {
            type: 'string',
            description: 'Date of the awards ceremony (ISO format)'
          },
          year: {
            type: 'number',
            description: 'Year of the awards ceremony'
          }
        }
      },
      
      minimumSources: 3,
      minimumConfidence: 80,
      minimumAgreement: 66
    });

    console.log('\n📊 Verification Result:');
    console.log('─'.repeat(50));
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Verified: ${result.verified ? '✅' : '❌'}`);
    console.log(`Confidence: ${result.confidence}%`);
    console.log(`Proof ID: ${result.proofId}`);

    await oracle.cleanup();
    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await oracle.cleanup();
    throw error;
  }
}

/**
 * Example: Verify Product Launch
 */
async function verifyProductLaunch() {
  const oracle = new OracleService(process.env.OPENAI_API_KEY!);

  try {
    console.log('📱 Starting product launch verification...\n');

    const result = await oracle.verifyEvent({
      predictionId: '507f1f77bcf86cd799439013',
      eventType: 'product_launch',
      claim: 'Apple released iPhone 16 in September 2024',
      
      schema: {
        description: 'Extract information about the iPhone 16 launch',
        fields: {
          productName: {
            type: 'string',
            description: 'Full name of the product (e.g., "iPhone 16 Pro Max")'
          },
          company: {
            type: 'string',
            description: 'Name of the company that launched the product'
          },
          launchDate: {
            type: 'string',
            description: 'Official launch/release date (ISO format)'
          }
        }
      },
      
      minimumSources: 3,
      minimumConfidence: 75,
      minimumAgreement: 66
    });

    console.log('\n📊 Verification Result:');
    console.log('─'.repeat(50));
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Verified: ${result.verified ? '✅' : '❌'}`);
    console.log(`Confidence: ${result.confidence}%`);

    await oracle.cleanup();
    return result;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await oracle.cleanup();
    throw error;
  }
}

// Run examples if executed directly
if (require.main === module) {
  const example = process.argv[2] || 'election';
  
  switch (example) {
    case 'election':
      verifyElectionResult();
      break;
    case 'movie':
      verifyMovieAward();
      break;
    case 'product':
      verifyProductLaunch();
      break;
    default:
      console.log('Usage: ts-node electionVerificationExample.ts [election|movie|product]');
  }
}

export { verifyElectionResult, verifyMovieAward, verifyProductLaunch };

