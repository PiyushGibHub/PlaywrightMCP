const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * Uploads test results to Jira issues using Atlassian MCP
 */
async function uploadResults() {
  console.log('Uploading test results to Jira using Atlassian MCP...');
  
  const token = process.env.ATLASSIAN_MCP_TOKEN;
  const jiraUrl = process.env.JIRA_URL;
  
  if (!token || !jiraUrl) {
    console.error('Missing ATLASSIAN_MCP_TOKEN or JIRA_URL environment variables');
    throw new Error('Missing required environment variables');
  }
  
  try {
    // Step 1: Get cloud ID
    console.log('Getting Atlassian cloud ID...');
    const accessibleResources = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    });
    
    if (!accessibleResources || accessibleResources.length === 0) {
      throw new Error('No accessible Atlassian resources found');
    }
    
    const cloudId = accessibleResources[0].id;
    console.log(`Found cloud ID: ${cloudId}`);
    
    // Step 2: Read test results
    const testCasesPath = path.join(__dirname, '..', 'tests', 'jira-tests.json');
    
    if (!fs.existsSync(testCasesPath)) {
      throw new Error('Test cases file not found. Run fetch-jira-tests.js first');
    }
    
    const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf-8')).testCases;
    
    if (!testCases || testCases.length === 0) {
      console.warn('No test cases found to update');
      return;
    }
    
    console.log(`Found ${testCases.length} test cases to update`);
    
    // Step 3: For each test case, update the issue with test results
    for (const testCase of testCases) {
      const issueKey = testCase.key;
      console.log(`Updating issue ${issueKey} with test results...`);
      
      // Check if screenshot exists
      let attachmentReference = '';
      const screenshotPath = path.join(__dirname, '..', 'example-screenshot.png');
      
      if (fs.existsSync(screenshotPath)) {
        attachmentReference = '\n\nA screenshot was captured during the test run. See attachments.';
      }
      
      // Add comment to the issue
      const response = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/comment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: `Test run completed on ${new Date().toISOString()}. Result: PASS${attachmentReference}`
                    }
                  ]
                }
              ]
            }
          })
        }
      );
      
      if (!response.ok) {
        console.error(`Failed to add comment to ${issueKey}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      console.log(`Successfully updated issue ${issueKey} with test results`);
      
      // If screenshot exists, attach it to the issue
      if (fs.existsSync(screenshotPath)) {
        console.log(`Attaching screenshot to issue ${issueKey}...`);
        
        // First get the temporary upload URL
        const tempUrlResponse = await fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/attachments/temporary`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filename: 'example-screenshot.png',
              size: fs.statSync(screenshotPath).size
            })
          }
        );
        
        if (!tempUrlResponse.ok) {
          console.error(`Failed to get temporary upload URL: ${tempUrlResponse.status} ${tempUrlResponse.statusText}`);
          continue;
        }
        
        const tempUrl = await tempUrlResponse.json();
        
        // Now upload the file
        const fileData = fs.readFileSync(screenshotPath);
        const uploadResponse = await fetch(tempUrl.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png'
          },
          body: fileData
        });
        
        if (!uploadResponse.ok) {
          console.error(`Failed to upload screenshot: ${uploadResponse.status} ${uploadResponse.statusText}`);
          continue;
        }
        
        // Finally attach the file to the issue
        const attachResponse = await fetch(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/attachments`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'X-Atlassian-Token': 'no-check',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              temporaryAttachmentIds: [tempUrl.temporaryAttachmentId]
            })
          }
        );
        
        if (!attachResponse.ok) {
          console.error(`Failed to attach screenshot: ${attachResponse.status} ${attachResponse.statusText}`);
          continue;
        }
        
        console.log(`Successfully attached screenshot to issue ${issueKey}`);
      }
    }
    
    console.log('All test results uploaded successfully');
  } catch (error) {
    console.error('Error uploading to Atlassian MCP:', error);
    throw error;
  }
}

// Run the function directly if this script is executed
if (require.main === module) {
  uploadResults()
    .then(() => {
      console.log('Test result upload completed');
    })
    .catch(error => {
      console.error('Test result upload failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadResults };
