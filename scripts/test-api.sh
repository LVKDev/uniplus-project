#!/bin/bash

##
## UniPlus Backend API - Test Suite with cURL
## Validates API endpoints without authentication
##

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
API_USER="${API_USER:-)}"
API_PASS="${API_PASS:-)}"
VERBOSE="${VERBOSE:-false}"

# Global test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

##
## Helper functions
##

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

# Build Authorization header
build_auth_header() {
  if [ -n "$API_USER" ] && [ -n "$API_PASS" ]; then
    local credentials=$(echo -n "$API_USER:$API_PASS" | base64)
    echo "Authorization: Basic $credentials"
  fi
}

# Perform HTTP request and check status code
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local data=$4
  local description=$5

  TESTS_RUN=$((TESTS_RUN + 1))
  
  local url="${API_BASE_URL}${endpoint}"
  local auth_header=$(build_auth_header)
  local cmd="curl -s -w '\n%{http_code}' -X $method '$url'"
  
  if [ -n "$auth_header" ]; then
    cmd="$cmd -H '$auth_header'"
  fi
  
  cmd="$cmd -H 'Content-Type: application/json'"
  
  if [ -n "$data" ]; then
    cmd="$cmd -d '$data'"
  fi

  if [ "$VERBOSE" = "true" ]; then
    log_info "Executing: $cmd"
  fi

  # Execute request and capture response
  local response=$(eval "$cmd")
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | sed '$d')

  # Check status code
  if [ "$http_code" = "$expected_status" ]; then
    log_success "$method $endpoint - Expected status $expected_status (Got: $http_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    if [ "$VERBOSE" = "true" ] && [ -n "$body" ]; then
      echo "     Response: ${body:0:100}..."
    fi
  else
    log_error "$method $endpoint - Expected status $expected_status but got $http_code"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    
    if [ -n "$body" ]; then
      echo "     Response: $body"
    fi
  fi
}

##
## Test Suite
##

run_tests() {
  echo
  echo "============================================"
  echo "  UniPlus API Test Suite"
  echo "============================================"
  echo "Base URL: $API_BASE_URL"
  if [ -n "$API_USER" ]; then
    echo "Authentication: Basic Auth (User: $API_USER)"
  else
    echo "Authentication: Disabled (No credentials provided)"
  fi
  echo "============================================"
  echo

  # Test 1: Server Health Check
  log_info "Testing server connectivity..."
  test_endpoint "GET" "/health" "200" "" "Server Health Check"
  echo

  # Test 2: Swagger Documentation
  log_info "Testing API documentation..."
  test_endpoint "GET" "/docs/" "200" "" "Swagger UI"
  test_endpoint "GET" "/openapi.json" "200" "" "OpenAPI Specification"
  echo

  # Test 3: List Pedidos (Orders)
  log_info "Testing Pedidos (Orders) endpoints..."
  test_endpoint "GET" "/api/pedidos" "200" "" "List all orders"
  test_endpoint "GET" "/api/pedidos?limit=10&offset=0" "200" "" "List orders with pagination"
  test_endpoint "GET" "/api/pedidos?single=true" "200" "" "Get single order"
  echo

  # Test 4: List Entidades (Entities)
  log_info "Testing Entidades (Entities) endpoints..."
  test_endpoint "GET" "/api/entidades" "200" "" "List all entities"
  test_endpoint "GET" "/api/entidades?limit=10" "200" "" "List entities with limit"
  echo

  # Test 5: List Produtos (Products)
  log_info "Testing Produtos (Products) endpoints..."
  test_endpoint "GET" "/api/produtos" "200" "" "List all products"
  test_endpoint "GET" "/api/produtos?limit=5" "200" "" "List products with limit"
  echo

  # Test 6: List Ordens de Serviço (Service Orders)
  log_info "Testing Ordens de Serviço endpoints..."
  test_endpoint "GET" "/api/ordens-servico" "200" "" "List all service orders"
  echo

  # Test 7: List Vendas (Sales)
  log_info "Testing Vendas (Sales) endpoints..."
  test_endpoint "GET" "/api/vendas" "200" "" "List all sales"
  echo

  # Test 8: List Tipo Documento Financeiro
  log_info "Testing Tipo Documento Financeiro endpoints..."
  test_endpoint "GET" "/api/tipo-documento-financeiro" "200" "" "List financial document types"
  echo

  # Test 9: 404 Not Found
  log_info "Testing error handling..."
  test_endpoint "GET" "/api/nonexistent" "404" "" "404 Not Found"
  echo

  # Test 10: Invalid method
  log_info "Testing invalid HTTP methods..."
  test_endpoint "DELETE" "/health" "405" "" "DELETE on GET-only endpoint (expected to fail or 405)"
  echo
}

##
## Authentication Tests
##

run_auth_tests() {
  echo
  echo "============================================"
  echo "  Authentication Tests"
  echo "============================================"
  echo

  # Test missing auth when required
  if [ -n "$API_USER" ] && [ -n "$API_PASS" ]; then
    log_info "Testing authentication requirements..."
    
    local url="${API_BASE_URL}/api/pedidos"
    local response=$(curl -s -w '\n%{http_code}' -X GET "$url" -H 'Content-Type: application/json')
    local http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "401" ]; then
      log_success "Request without auth correctly rejected with 401"
    else
      log_warning "Request without auth returned $http_code (expected 401)"
    fi
  else
    log_warning "Skipping auth tests - no credentials configured"
  fi
  
  echo
}

##
## Performance Tests
##

run_performance_tests() {
  echo
  echo "============================================"
  echo "  Performance Tests"
  echo "============================================"
  echo

  log_info "Measuring response times..."

  local endpoints=(
    "/health"
    "/api/pedidos?limit=10"
    "/api/entidades?limit=10"
    "/api/produtos?limit=10"
  )

  for endpoint in "${endpoints[@]}"; do
    local auth_header=$(build_auth_header)
    local start=$(date +%s%N)
    
    if [ -n "$auth_header" ]; then
      curl -s -X GET "$API_BASE_URL$endpoint" -H "$auth_header" -H 'Content-Type: application/json' > /dev/null
    else
      curl -s -X GET "$API_BASE_URL$endpoint" -H 'Content-Type: application/json' > /dev/null
    fi
    
    local end=$(date +%s%N)
    local duration=$(( ($end - $start) / 1000000 ))
    
    if [ $duration -lt 1000 ]; then
      log_success "GET $endpoint - ${duration}ms"
    elif [ $duration -lt 5000 ]; then
      log_warning "GET $endpoint - ${duration}ms (slow)"
    else
      log_error "GET $endpoint - ${duration}ms (very slow)"
    fi
  done
  
  echo
}

##
## Main Execution
##

main() {
  # Check if server is reachable
  log_info "Checking server connectivity..."
  if ! curl -s -f "$API_BASE_URL/health" > /dev/null 2>&1; then
    log_error "Server at $API_BASE_URL is not reachable!"
    echo "Make sure the API is running: npm run dev"
    exit 1
  fi
  log_success "Server is reachable!"
  echo

  # Run test suites
  run_tests
  run_auth_tests
  run_performance_tests

  # Print summary
  echo "============================================"
  echo "  Test Summary"
  echo "============================================"
  echo "Total Tests: $TESTS_RUN"
  echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
  echo "============================================"
  echo

  # Exit with appropriate code
  if [ $TESTS_FAILED -eq 0 ]; then
    log_success "All tests passed! ✓"
    exit 0
  else
    log_error "$TESTS_FAILED test(s) failed"
    exit 1
  fi
}

# Show usage
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  cat << EOF
Usage: $0 [OPTIONS]

Options:
  -h, --help                Show this help message
  -u, --url URL             API base URL (default: http://localhost:3000)
  -U, --user USERNAME       Basic auth username
  -P, --password PASSWORD   Basic auth password
  -v, --verbose            Enable verbose output

Environment Variables:
  API_BASE_URL              API base URL
  API_USER                  Basic auth username
  API_PASS                  Basic auth password
  VERBOSE                   Enable verbose output (true/false)

Examples:
  # Test without authentication
  $0

  # Test with authentication
  $0 -U myuser -P mypass

  # Test custom server
  $0 -u http://api.example.com:3000

  # Test with verbose output
  VERBOSE=true $0

EOF
  exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--url)
      API_BASE_URL="$2"
      shift 2
      ;;
    -U|--user)
      API_USER="$2"
      shift 2
      ;;
    -P|--password)
      API_PASS="$2"
      shift 2
      ;;
    -v|--verbose)
      VERBOSE="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run main test routine
main
