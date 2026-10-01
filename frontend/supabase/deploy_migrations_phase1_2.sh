#!/bin/bash
# Deploy Phase 1 & 2 Migrations
# Customer Relationships + Invoice Numbering + Audit System

set -e  # Exit on error

echo "=========================================="
echo "Phase 1 & 2 Migration Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL not set.${NC}"
    echo "Please set DATABASE_URL environment variable or provide connection string."
    echo ""
    read -p "Enter PostgreSQL connection string: " DATABASE_URL
fi

echo -e "${GREEN}Starting migration deployment...${NC}"
echo ""

# Function to run migration with error handling
run_migration() {
    local migration_file=$1
    local migration_name=$2
    
    echo "=========================================="
    echo "Running: $migration_name"
    echo "File: $migration_file"
    echo "=========================================="
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi
    
    if psql "$DATABASE_URL" -f "$migration_file"; then
        echo -e "${GREEN}✓ $migration_name completed successfully${NC}"
        echo ""
    else
        echo -e "${RED}✗ $migration_name failed${NC}"
        echo "Migration failed at: $migration_file"
        exit 1
    fi
}

# Confirm before proceeding
echo "This will run 4 migrations in order:"
echo "  1. Fix customer relationships (015)"
echo "  2. Atomic invoice numbering (016)"
echo "  3. Invoice soft delete (017)"
echo "  4. Audit event types (018)"
echo ""
echo -e "${YELLOW}WARNING: This will modify your database schema.${NC}"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Starting migrations...${NC}"
echo ""

# Run migrations in order
run_migration "frontend/supabase/migrations/015_fix_customer_relationships.sql" "Migration 015: Fix Customer Relationships"
run_migration "frontend/supabase/migrations/016_atomic_invoice_numbering.sql" "Migration 016: Atomic Invoice Numbering"
run_migration "frontend/supabase/migrations/017_invoice_soft_delete.sql" "Migration 017: Invoice Soft Delete"
run_migration "frontend/supabase/migrations/018_audit_event_types.sql" "Migration 018: Audit Event Types"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review PHASE_1_2_COMPLETION_SUMMARY.md"
echo "  2. Run verification queries"
echo "  3. Test customer history queries"
echo "  4. Test concurrent invoice creation"
echo "  5. Test invoice cancellation"
echo "  6. Proceed to Phase 3 & 4 (API/Frontend updates)"
echo ""
