#!/usr/bin/env node

/**
 * UniPlus API - Mock Endpoints Test Suite
 * Tests mock endpoints that work without UniPlus credentials
 */

const http = require("http");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

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
async function testEndpoint(
  method,
  path,
  expectedStatus,
  data = null,
  description = "",
) {
  testsRun++;

  try {
    const response = await makeRequest(method, path, data);
    const success = response.statusCode === expectedStatus;

    const desc = description ? ` - ${description}` : "";

    if (success) {
      logSuccess(`${method} ${path} - Status ${response.statusCode}${desc}`);
      testsPassed++;

      // Try to parse JSON response
      try {
        const json = JSON.parse(response.body);
        if (json.success === true) {
          if (json.data && Array.isArray(json.data)) {
            console.log(`     Response: ${json.data.length} records`);
          } else if (json.data && typeof json.data === "object") {
            console.log(
              `     Response: ${JSON.stringify(json.data).slice(0, 80)}...`,
            );
          }
        }
      } catch (e) {
        // Not JSON, skip parsing
      }
    } else {
      logError(
        `${method} ${path} - Expected ${expectedStatus}, got ${response.statusCode}${desc}`,
      );
      testsFailed++;

      if (response.body) {
        console.log(`     Response: ${response.body.slice(0, 150)}...`);
      }
    }
  } catch (error) {
    logError(`${method} ${path} - Request failed: ${error.message}`);
    testsFailed++;
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("  UniPlus API - Mock Endpoints Test Suite");
  console.log("=".repeat(60));
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log("=".repeat(60) + "\n");

  // Test 1: Mock Info
  logInfo("Testing mock endpoints information...");
  await testEndpoint("GET", "/mock/info", 200, null, "Mock endpoints info");
  console.log();

  // Test 2: Mock Pedidos (Orders)
  logInfo("Testing Mock Pedidos (Orders) endpoints...");
  await testEndpoint("GET", "/mock/pedidos", 200, null, "List all mock orders");
  await testEndpoint(
    "GET",
    "/mock/pedidos?limit=10&offset=0",
    200,
    null,
    "List mock orders with pagination",
  );
  await testEndpoint(
    "GET",
    "/mock/pedidos?single=true",
    200,
    null,
    "Get single mock order",
  );
  await testEndpoint("GET", "/mock/pedidos/1", 200, null, "Get order by ID");
  await testEndpoint(
    "GET",
    "/mock/pedidos/999",
    404,
    null,
    "Order not found (404)",
  );
  console.log();

  // Test 3: Post new order
  logInfo("Testing POST - Create mock order...");
  const newOrder = {
    cliente: 789,
    filial: 2,
    status: "1",
    itens: [{ produto: 999, quantidade: 15, valor: 75.0 }],
  };
  await testEndpoint(
    "POST",
    "/mock/pedidos",
    201,
    newOrder,
    "Create new order",
  );
  console.log();

  // Test 4: Put update order
  logInfo("Testing PUT - Update mock order...");
  const updateOrder = {
    codigo: 1,
    cliente: 123,
    filial: 1,
    status: "9",
    itens: [{ produto: 456, quantidade: 8, valor: 120.0 }],
  };
  await testEndpoint("PUT", "/mock/pedidos", 200, updateOrder, "Update order");
  console.log();

  // Test 5: Delete order
  logInfo("Testing DELETE - Remove mock order...");
  await testEndpoint("DELETE", "/mock/pedidos/1", 200, null, "Delete order");
  await testEndpoint(
    "DELETE",
    "/mock/pedidos/999",
    404,
    null,
    "Delete non-existent order (404)",
  );
  console.log();

  // Test 6: Mock Entidades (Entities)
  logInfo("Testing Mock Entidades (Entities) endpoints...");
  await testEndpoint(
    "GET",
    "/mock/entidades",
    200,
    null,
    "List all mock entities",
  );
  await testEndpoint(
    "GET",
    "/mock/entidades?limit=5",
    200,
    null,
    "List entities with limit",
  );
  await testEndpoint(
    "GET",
    "/mock/entidades/123",
    200,
    null,
    "Get entity by code",
  );
  await testEndpoint(
    "GET",
    "/mock/entidades/999",
    404,
    null,
    "Entity not found (404)",
  );
  console.log();

  // Test 7: Mock Produtos (Products)
  logInfo("Testing Mock Produtos (Products) endpoints...");
  await testEndpoint(
    "GET",
    "/mock/produtos",
    200,
    null,
    "List all mock products",
  );
  await testEndpoint(
    "GET",
    "/mock/produtos?limit=5",
    200,
    null,
    "List products with limit",
  );
  await testEndpoint(
    "GET",
    "/mock/produtos/456",
    200,
    null,
    "Get product by code",
  );
  await testEndpoint(
    "GET",
    "/mock/produtos/999",
    404,
    null,
    "Product not found (404)",
  );
  console.log();

  // Test 8: Health and docs
  logInfo("Testing health and documentation endpoints...");
  await testEndpoint("GET", "/health", 200, null, "Health check");
  await testEndpoint("GET", "/docs/", 200, null, "Swagger UI");
  await testEndpoint("GET", "/openapi.json", 200, null, "OpenAPI spec");
  console.log();

  // Summary
  console.log("=".repeat(60));
  console.log("  Test Summary");
  console.log("=".repeat(60));
  console.log(`Total Tests: ${testsRun}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log("=".repeat(60) + "\n");

  if (testsFailed === 0) {
    logSuccess("All tests passed! ✓\n");
    return true;
  } else {
    logError(`${testsFailed} test(s) failed\n`);
    return false;
  }
}

/**
 * Main execution
 */
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

    const success = await runTests();

    if (success) {
      console.log("✨ Mock endpoints are fully functional!");
      console.log("Ready for n8n integration!\n");
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    process.exit(1);
  }
})();
