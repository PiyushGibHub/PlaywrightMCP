# PlaywrightMCP E2E Testing

This project demonstrates E2E testing using Playwright MCP for browser interactions and Atlassian MCP for Jira integration. The workflow uses Model Context Protocol (MCP) to communicate between different services.

## What is MCP?

MCP (Model Context Protocol) is a protocol designed to enable communication between different tools and services. In this project:

- **Playwright MCP**: Provides a server for browser automation
- **Atlassian MCP**: Allows interaction with Jira and other Atlassian products

## Setup

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- GitHub account with repository permissions
- Jira access with API token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PiyushGibHub/PlaywrightMCP.git
cd PlaywrightMCP
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers and MCP:
```bash
npx playwright install --with-deps
npm install @playwright/mcp@latest
```

## Configuration

### GitHub Secrets

To run the GitHub Actions workflow, you need to set up the following repository secrets:

- `ATLASSIAN_MCP_TOKEN`: Your Atlassian API token for MCP integration
- `JIRA_URL`: Your Jira instance URL (e.g., https://your-domain.atlassian.net)

To get your Atlassian MCP token:
1. Log in to your Atlassian account
2. Go to Account Settings > Security > Create and manage API tokens
3. Create a new API token and copy it
4. Add it to your GitHub repository secrets

### Local Configuration

Create a `.env` file in the root directory with the following content:

```
ATLASSIAN_MCP_TOKEN=your-api-token
JIRA_URL=https://your-domain.atlassian.net
PLAYWRIGHT_MCP_PORT=8080
```

## Running Tests

### Starting the MCP Server

Before running tests, start the Playwright MCP server:

```bash
npm run mcp:start
```

This will start a Playwright MCP server on port 8080.

### Local Execution

In a separate terminal, run:

```bash
npm run test
```

### Fetching Jira Test Cases

To fetch test cases from Jira:

```bash
node scripts/fetch-jira-tests.js
```

### Uploading Test Results to Jira

After running tests:

```bash
node scripts/upload-results.js
```

### CI Execution

The tests will run automatically on GitHub Actions when:
- Pushing to the main branch
- Creating a pull request to the main branch
- Manually triggering the workflow

## Project Structure

```
PlaywrightMCP/
├── .github/
│   └── workflows/
│       └── e2e-tests.yml    # GitHub Actions workflow configuration
├── scripts/
│   ├── fetch-jira-tests.js  # Script to fetch test cases from Jira
│   └── upload-results.js    # Script to upload test results to Jira
├── tests/
│   └── mcp-test.js          # Example test using Playwright MCP
├── playwright.config.js     # Playwright configuration
└── package.json             # Project dependencies and scripts
├── package.json             # Project dependencies and scripts
└── README.md                # This file
```

## Extending the Tests

1. Add new test files in the `tests` directory
2. Update the GitHub Actions workflow as needed
3. Customize the Jira integration in the `scripts` directory