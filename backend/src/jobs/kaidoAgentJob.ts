import { CronJob } from 'cron';
import kaidoAgentService from '../services/kaidoAgentService';
import AgentConfig from '../models/AgentConfig';

/**
 * KAIDO Agent Jobs
 * Autonomous prediction creation and resolution jobs
 */

let creationJob: CronJob | null = null;
let resolutionJob: CronJob | null = null;
let isInitialized = false;

/**
 * Initialize the KAIDO Agent and start jobs
 */
export async function initializeKaidoAgent(): Promise<void> {
  try {
    console.log('🤖 Initializing KAIDO Agent...');
    
    // Initialize the agent service
    await kaidoAgentService.initialize();
    
    // Get configuration
    const config = await kaidoAgentService.getConfig();
    
    if (!config.enabled) {
      console.log('⚠️ KAIDO Agent is disabled. Jobs will not start.');
      console.log('   Enable via admin panel or set enabled: true in AgentConfig');
      isInitialized = true;
      return;
    }
    
    // Start the jobs
    await startAgentJobs();
    
    isInitialized = true;
    console.log('✅ KAIDO Agent initialized and jobs started');
  } catch (error) {
    console.error('❌ Failed to initialize KAIDO Agent:', error);
  }
}

/**
 * Start the agent cron jobs
 */
export async function startAgentJobs(): Promise<void> {
  const config = await kaidoAgentService.getConfig();
  
  // Stop existing jobs if running
  stopAgentJobs();
  
  // Creation Job - Creates new predictions periodically
  if (config.creationEnabled) {
    creationJob = new CronJob(
      config.creationCronSchedule || '0 */4 * * *', // Default: every 4 hours
      async function() {
        try {
          console.log('\n🤖 ========================================');
          console.log('   KAIDO Agent - Prediction Creation Cycle');
          console.log('   ========================================\n');
          
          await kaidoAgentService.runCreationCycle();
        } catch (error) {
          console.error('Error in KAIDO creation job:', error);
        }
      },
      null,
      false, // Don't start immediately
      'UTC'
    );
    
    creationJob.start();
    console.log(`📅 KAIDO Creation Job scheduled: ${config.creationCronSchedule || '0 */4 * * *'}`);
  }
  
  // Resolution Job - Resolves expired predictions
  if (config.resolutionEnabled) {
    resolutionJob = new CronJob(
      config.resolutionCronSchedule || '* * * * *', // Default: every minute
      async function() {
        try {
          await kaidoAgentService.runResolutionCycle();
        } catch (error) {
          console.error('Error in KAIDO resolution job:', error);
        }
      },
      null,
      false,
      'UTC'
    );
    
    resolutionJob.start();
    console.log(`📅 KAIDO Resolution Job scheduled: ${config.resolutionCronSchedule || '* * * * *'}`);
  }
}

/**
 * Stop all agent jobs
 */
export function stopAgentJobs(): void {
  if (creationJob) {
    creationJob.stop();
    creationJob = null;
    console.log('⏹️ KAIDO Creation Job stopped');
  }
  
  if (resolutionJob) {
    resolutionJob.stop();
    resolutionJob = null;
    console.log('⏹️ KAIDO Resolution Job stopped');
  }
}

/**
 * Restart jobs with new configuration
 */
export async function restartAgentJobs(): Promise<void> {
  console.log('🔄 Restarting KAIDO Agent jobs...');
  stopAgentJobs();
  await startAgentJobs();
}

/**
 * Manually trigger a creation cycle
 */
export async function triggerCreationCycle(): Promise<any> {
  console.log('🔧 Manual trigger: Creation cycle');
  return await kaidoAgentService.runCreationCycle();
}

/**
 * Manually trigger a resolution cycle
 */
export async function triggerResolutionCycle(): Promise<void> {
  console.log('🔧 Manual trigger: Resolution cycle');
  await kaidoAgentService.runResolutionCycle();
}

/**
 * Get agent status
 */
export async function getAgentStatus(): Promise<any> {
  const status = await kaidoAgentService.getStatus();
  return {
    ...status,
    isInitialized,
    creationJobRunning: (creationJob as any)?.running || false,
    resolutionJobRunning: (resolutionJob as any)?.running || false
  };
}

/**
 * Enable or disable the agent
 */
export async function setAgentEnabled(enabled: boolean): Promise<void> {
  await AgentConfig.findOneAndUpdate({}, { enabled }, { upsert: true });
  
  if (enabled) {
    await startAgentJobs();
  } else {
    stopAgentJobs();
  }
  
  console.log(`🤖 KAIDO Agent ${enabled ? 'enabled' : 'disabled'}`);
}

export default {
  initializeKaidoAgent,
  startAgentJobs,
  stopAgentJobs,
  restartAgentJobs,
  triggerCreationCycle,
  triggerResolutionCycle,
  getAgentStatus,
  setAgentEnabled
};

