const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/**
 * Fetches test cases from Jira using Atlassian MCP
 */
async function fetchJiraTests() {
  console.log('Fetching Jira test cases using Atlassian MCP...');
  
  const token = process.env.ATLASSIAN_MCP_TOKEN;
  const jiraUrl = process.env.JIRA_URL;
  
  if (!token || !jiraUrl) {
    console.error('Missing ATLASSIAN_MCP_TOKEN or JIRA_URL environment variables');
    throw new Error('Missing required environment variables');
  }
  
  try {
    // Step 1: Get cloud ID first
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
    
    // Step 2: Fetch test cases from Jira
    console.log('Fetching test cases from Jira...');
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=project=MC02 AND type=Test AND status="To Do"`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the data
    const testCases = data.issues ? data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description ? 
        (issue.fields.description.content ? 
          issue.fields.description.content[0]?.content[0]?.text || "No description" : 
          "No description") : 
        "No description",
      status: issue.fields.status.name
    })) : [];
    
    const result = { testCases };
    
    // Ensure tests directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'tests'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'tests'), { recursive: true });
    }
    
    // Write results to file
    fs.writeFileSync(
      path.join(__dirname, '..', 'tests', 'jira-tests.json'), 
      JSON.stringify(result, null, 2)
    );
    
    console.log(`Successfully fetched ${testCases.length} test cases from Jira`);
    return result;
  } catch (error) {
    console.error('Error fetching from Atlassian MCP:', error);
    
    // Create a mock file for fallback
    const mockData = {
      "testCases": [
        {
          "key": "MC02-9",
          "summary": "Login Test - Admin Credentials",
          "description": "Test login functionality with admin credentials",
          "status": "To Do"
        },
        {
          "key": "MC02-13",
          "summary": "Application Version Validation Test",
          "description": "Validate the application version on login page",
          "status": "To Do"
        }
      ]
    };
    
    // Ensure tests directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'tests'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'tests'), { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'tests', 'jira-tests.json'), 
      JSON.stringify(mockData, null, 2)
    );
    
    console.log('Created mock test cases file due to error');
    return mockData;
  }
}

// Run the function directly if this script is executed
if (require.main === module) {
  fetchJiraTests()
    .then(() => {
      console.log('Jira test fetch completed');
    })
    .catch(error => {
      console.error('Jira test fetch failed:', error);
      process.exit(1);
    });
}

module.exports = { fetchJiraTests };
