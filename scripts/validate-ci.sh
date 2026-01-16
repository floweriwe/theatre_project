#!/bin/bash
# =============================================================================
# CI Pipeline Validation Script
# =============================================================================
# Validates that the local environment can pass CI checks before pushing

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

run_check() {
    local name="$1"
    local command="$2"
    local dir="${3:-.}"

    echo -e "${YELLOW}Running:${NC} $name"

    if (cd "$PROJECT_ROOT/$dir" && eval "$command" > /dev/null 2>&1); then
        print_success "$name passed"
        return 0
    else
        print_error "$name failed"
        echo -e "  ${YELLOW}Fix with:${NC} cd $dir && $command"
        return 1
    fi
}

# =============================================================================
# Main Validation
# =============================================================================

print_header "Theatre Management System - CI Validation"

echo "This script validates that your code will pass CI checks."
echo "Running checks in: $PROJECT_ROOT"
echo ""

# -----------------------------------------------------------------------------
# Check 1: Python Linting
# -----------------------------------------------------------------------------
print_header "1. Python Linting (Ruff)"

if command -v ruff &> /dev/null; then
    run_check "Ruff linting" "ruff check ." "backend" || true
else
    print_warning "Ruff not installed. Run: pip install ruff"
fi

# -----------------------------------------------------------------------------
# Check 2: Python Type Checking
# -----------------------------------------------------------------------------
print_header "2. Python Type Checking (MyPy)"

if command -v mypy &> /dev/null; then
    run_check "MyPy type checking" "mypy app --show-error-codes" "backend" || true
else
    print_warning "MyPy not installed. Run: pip install mypy"
fi

# -----------------------------------------------------------------------------
# Check 3: Python Tests
# -----------------------------------------------------------------------------
print_header "3. Python Tests (Pytest)"

if command -v pytest &> /dev/null; then
    # Check if PostgreSQL is running
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        run_check "Backend tests" "pytest tests/ -v" "backend" || true
    else
        print_warning "PostgreSQL not running. Start with: docker-compose up -d postgres"
        print_warning "Skipping backend tests"
    fi
else
    print_warning "Pytest not installed. Run: pip install pytest"
fi

# -----------------------------------------------------------------------------
# Check 4: Frontend Linting
# -----------------------------------------------------------------------------
print_header "4. Frontend Linting (ESLint)"

if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    run_check "ESLint" "npm run lint" "frontend" || true
else
    print_warning "Node modules not installed. Run: cd frontend && npm ci"
fi

# -----------------------------------------------------------------------------
# Check 5: TypeScript Type Checking
# -----------------------------------------------------------------------------
print_header "5. TypeScript Type Checking"

if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    run_check "TypeScript check" "npm run type-check" "frontend" || true
else
    print_warning "Node modules not installed. Run: cd frontend && npm ci"
fi

# -----------------------------------------------------------------------------
# Check 6: Frontend Build
# -----------------------------------------------------------------------------
print_header "6. Frontend Build"

if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    run_check "Frontend build" "npm run build" "frontend" || true
else
    print_warning "Node modules not installed. Run: cd frontend && npm ci"
fi

# -----------------------------------------------------------------------------
# Check 7: Docker Build (Optional)
# -----------------------------------------------------------------------------
print_header "7. Docker Build Verification"

if command -v docker &> /dev/null; then
    echo -e "${YELLOW}Running:${NC} Docker build verification (this may take a few minutes)"

    # Backend build
    if docker build -t theatre-backend:test "$PROJECT_ROOT/backend" > /dev/null 2>&1; then
        print_success "Backend Docker build"
    else
        print_error "Backend Docker build failed"
        echo -e "  ${YELLOW}Debug with:${NC} docker build -t theatre-backend:test ./backend"
    fi

    # Frontend build
    if docker build -f "$PROJECT_ROOT/frontend/Dockerfile.prod" -t theatre-frontend:test "$PROJECT_ROOT/frontend" > /dev/null 2>&1; then
        print_success "Frontend Docker build"
    else
        print_error "Frontend Docker build failed"
        echo -e "  ${YELLOW}Debug with:${NC} docker build -f frontend/Dockerfile.prod -t theatre-frontend:test ./frontend"
    fi
else
    print_warning "Docker not installed. Skipping Docker build checks"
fi

# =============================================================================
# Summary
# =============================================================================

print_header "Validation Summary"

echo -e "${GREEN}Passed:${NC} $PASSED checks"
echo -e "${RED}Failed:${NC} $FAILED checks"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All checks passed! Ready to push.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Some checks failed. Fix issues before pushing.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
