#!/usr/bin/env node

/**
 * UniPlus API Test Suite
 * Node.js based HTTP testing for the API
 */

const http = require("http");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_USER = process.env.API_USER || "";
const API_PASS = process.env.API_PASS || "";

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function logInfo(msg) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}[✓]${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}[✗]${colors.reset} ${msg}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}[!]${colors.reset} ${msg}`);
}

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
    };

    // Add Basic Auth if configured
    if (API_USER && API_PASS) {
      const credentials = Buffer.from(`${API_USER}:${API_PASS}`).toString(
        "base64",
      );
      options.headers["Authorization"] = `Basic ${credentials}`;
    }

    const req = (url.protocol === "https:" ? require("https") : http).request(
      options,
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: body,
            headers: res.headers,
          });
        });
      },
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test an endpoint
 */
async function testEndpoint(method, path, expectedStatus, data = null) {
  testsRun++;

  try {
    const response = await makeRequest(method, path, data);
    const success = response.statusCode === expectedStatus;

    if (success) {
      logSuccess(`${method} ${path} - Status ${response.statusCode}`);
      testsPassed++;

      // Try to parse JSON response
      try {
        const json = JSON.parse(response.body);
        if (json.success === false) {
          logWarning(`  Response indicates error: ${json.error}`);
        }
      } catch (e) {
        // Not JSON, skip parsing
      }
    } else {
      logError(
        `${method} ${path} - Expected ${expectedStatus}, got ${response.statusCode}`,
      );
      testsFailed++;

      if (response.body) {
        console.log(`  Response: ${response.body.slice(0, 150)}...`);
      }
    }
  } catch (error) {
    logError(`${method} ${path} - Request failed: ${error.message}`);
    testsFailed++;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("\n" + "=".repeat(50));
  console.log("  UniPlus API Test Suite (Node.js)");
  console.log("=".repeat(50));
  console.log(`Base URL: ${API_BASE_URL}`);
  if (API_USER) {
    console.log(`Authentication: Basic Auth (User: ${API_USER})`);
  } else {
    console.log("Authentication: Disabled");
  }
  console.log("=".repeat(50) + "\n");

  // Test 1: Health Check
  logInfo("Testing server connectivity...");
  await testEndpoint("GET", "/health", 200);
  console.log();

  // Test 2: Swagger Documentation
  logInfo("Testing API documentation...");
  await testEndpoint("GET", "/docs/", 200);
  await testEndpoint("GET", "/openapi.json", 200);
  console.log();

  // Test 3: Pedidos (Orders)
  logInfo("Testing Pedidos (Orders) endpoints...");
  await testEndpoint("GET", "/api/pedidos", 200);
  await testEndpoint("GET", "/api/pedidos?limit=10&offset=0", 200);
  await testEndpoint("GET", "/api/pedidos?single=true", 200);
  console.log();

  // Test 4: Entidades (Entities)
  logInfo("Testing Entidades (Entities) endpoints...");
  await testEndpoint("GET", "/api/entidades", 200);
  await testEndpoint("GET", "/api/entidades?limit=10", 200);
  console.log();

  // Test 5: Produtos (Products)
  logInfo("Testing Produtos (Products) endpoints...");
  await testEndpoint("GET", "/api/produtos", 200);
  await testEndpoint("GET", "/api/produtos?limit=5", 200);
  console.log();

  // Test 6: Ordens de Serviço (Service Orders)
  logInfo("Testing Ordens de Serviço endpoints...");
  await testEndpoint("GET", "/api/ordens-servico", 200);
  console.log();

  // Test 7: Vendas (Sales)
  logInfo("Testing Vendas (Sales) endpoints...");
  await testEndpoint("GET", "/api/vendas", 200);
  console.log();

  // Test 8: Tipo Documento Financeiro
  logInfo("Testing Tipo Documento Financeiro endpoints...");
  await testEndpoint("GET", "/api/tipo-documento-financeiro", 200);
  console.log();

  // Test 9: 404 Not Found
  logInfo("Testing error handling...");
  await testEndpoint("GET", "/api/nonexistent", 404);
  console.log();

  // Summary
  console.log("=".repeat(50));
  console.log("  Test Summary");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${testsRun}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log("=".repeat(50) + "\n");

  if (testsFailed === 0) {
    logSuccess("All tests passed! ✓");
    process.exit(0);
  } else {
    logError(`${testsFailed} test(s) failed`);
    process.exit(1);
  }
}

// Main
(async () => {
  try {
    // Check connectivity first
    logInfo("Checking server connectivity...");
    try {
      const response = await makeRequest("GET", "/health");
      if (response.statusCode === 200) {
        logSuccess("Server is reachable!");
        console.log();
      } else {
        logWarning(
          `Server responded with status ${response.statusCode}, but continuing tests...`,
        );
        console.log();
      }
    } catch (error) {
      logError(`Cannot reach server at ${API_BASE_URL}`);
      logError(`Error: ${error.message}`);
      logInfo("Make sure the API is running: npm run dev");
      process.exit(1);
    }

    await runTests();
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    process.exit(1);
  }
})();
