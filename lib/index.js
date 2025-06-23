import 'ccusage';

export async function main() {
  console.log('ccusage-byobu: Claude Code usage metrics with byobu integration');

  try {
    // Since ccusage is a CLI tool, we'll run it as a basic integration
    // Future tasks will expand this functionality
    console.log('Running ccusage...');
    // For now, just acknowledge the integration
    console.log('ccusage integration ready - future features will be added in subsequent tasks');
  } catch (error) {
    console.error('Failed to retrieve usage metrics:', error.message);
    throw error;
  }
}
