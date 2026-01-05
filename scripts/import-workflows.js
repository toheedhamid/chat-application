#!/usr/bin/env node

/**
 * n8n Workflow Auto-Import Script
 * Imports all workflows from n8n_workflows/ directory to n8n instance
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration from environment variables
const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_BASIC_AUTH_USER = process.env.N8N_BASIC_AUTH_USER || '';
const N8N_BASIC_AUTH_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || '';
const WORKFLOWS_DIR = process.env.WORKFLOWS_DIR || '/data/n8n_workflows';

// Base URL for n8n API
const N8N_BASE_URL = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;

// Create basic auth header if credentials are provided
const getAuthHeader = () => {
  if (N8N_BASIC_AUTH_USER && N8N_BASIC_AUTH_PASSWORD) {
    const credentials = Buffer.from(`${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}`).toString('base64');
    return `Basic ${credentials}`;
  }
  return null;
};

// Make HTTP request helper
const makeRequest = (method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, N8N_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (getAuthHeader()) {
      options.headers['Authorization'] = getAuthHeader();
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.message || body}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: body });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Wait for n8n to be ready
const waitForN8n = async (maxAttempts = 30, delay = 2000) => {
  console.log('Waiting for n8n to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest('GET', '/healthz');
      console.log('✓ n8n is ready!');
      return true;
    } catch (error) {
      if (i < maxAttempts - 1) {
        console.log(`Attempt ${i + 1}/${maxAttempts}: n8n not ready yet, waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`n8n did not become ready after ${maxAttempts} attempts`);
      }
    }
  }
};

// Get all workflows from n8n
const getExistingWorkflows = async () => {
  try {
    const response = await makeRequest('GET', '/api/v1/workflows');
    return response.data || [];
  } catch (error) {
    console.warn('Could not fetch existing workflows:', error.message);
    return [];
  }
};

// Import a single workflow
const importWorkflow = async (workflowData, existingWorkflows) => {
  const workflowName = workflowData.name;
  const existingWorkflow = existingWorkflows.find(w => w.name === workflowName);
  
  try {
    if (existingWorkflow) {
      // Update existing workflow
      console.log(`Updating workflow: ${workflowName}...`);
      const response = await makeRequest('PUT', `/api/v1/workflows/${existingWorkflow.id}`, workflowData);
      console.log(`✓ Updated: ${workflowName} (ID: ${existingWorkflow.id})`);
      
      // Ensure AnswerQuery2 is activated
      if (workflowName === 'AnswerQuery2' && !workflowData.active) {
        console.log(`Activating AnswerQuery2...`);
        await makeRequest('POST', `/api/v1/workflows/${existingWorkflow.id}/activate`);
        console.log(`✓ Activated: AnswerQuery2`);
      }
      
      return { success: true, action: 'updated', workflow: workflowName, id: existingWorkflow.id };
    } else {
      // Create new workflow
      console.log(`Creating workflow: ${workflowName}...`);
      const response = await makeRequest('POST', '/api/v1/workflows', workflowData);
      const workflowId = response.data.id;
      console.log(`✓ Created: ${workflowName} (ID: ${workflowId})`);
      
      // Ensure AnswerQuery2 is activated
      if (workflowName === 'AnswerQuery2') {
        console.log(`Activating AnswerQuery2...`);
        await makeRequest('POST', `/api/v1/workflows/${workflowId}/activate`);
        console.log(`✓ Activated: AnswerQuery2`);
      }
      
      return { success: true, action: 'created', workflow: workflowName, id: workflowId };
    }
  } catch (error) {
    console.error(`✗ Failed to import ${workflowName}:`, error.message);
    return { success: false, workflow: workflowName, error: error.message };
  }
};

// Main import function
const importAllWorkflows = async () => {
  console.log('Starting workflow import process...');
  console.log(`Workflows directory: ${WORKFLOWS_DIR}`);
  console.log(`n8n API: ${N8N_BASE_URL}`);
  
  // Wait for n8n to be ready
  await waitForN8n();
  
  // Get existing workflows
  console.log('Fetching existing workflows...');
  const existingWorkflows = await getExistingWorkflows();
  console.log(`Found ${existingWorkflows.length} existing workflow(s)`);
  
  // Read workflow files
  let workflowFiles = [];
  try {
    workflowFiles = fs.readdirSync(WORKFLOWS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(WORKFLOWS_DIR, file));
    console.log(`Found ${workflowFiles.length} workflow file(s) to import`);
  } catch (error) {
    console.error(`Error reading workflows directory: ${error.message}`);
    process.exit(1);
  }
  
  // Import each workflow
  const results = [];
  for (const filePath of workflowFiles) {
    try {
      const workflowData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const result = await importWorkflow(workflowData, existingWorkflows);
      results.push(result);
      
      // Small delay between imports to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error.message);
      results.push({ success: false, workflow: path.basename(filePath), error: error.message });
    }
  }
  
  // Summary
  console.log('\n=== Import Summary ===');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✓ Successfully imported: ${successful.length}`);
  successful.forEach(r => {
    console.log(`  - ${r.workflow} (${r.action})`);
  });
  
  if (failed.length > 0) {
    console.log(`\n✗ Failed to import: ${failed.length}`);
    failed.forEach(r => {
      console.log(`  - ${r.workflow}: ${r.error}`);
    });
  }
  
  console.log('\nWorkflow import process completed!');
  return results;
};

// Run if executed directly
if (require.main === module) {
  importAllWorkflows()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importAllWorkflows, waitForN8n };
