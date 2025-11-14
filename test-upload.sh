#!/bin/bash

# Test Upload Functionality - HijauIn Backend
# This script tests all upload endpoints

echo "🧪 HijauIn Upload Test Script"
echo "=============================="
echo ""

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
ADMIN_TOKEN=${ADMIN_TOKEN:-""}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ Error: ADMIN_TOKEN is required${NC}"
    echo ""
    echo "Usage:"
    echo "  ADMIN_TOKEN=your_token ./test-upload.sh"
    echo ""
    echo "Or set BASE_URL for different environment:"
    echo "  BASE_URL=https://api.example.com ADMIN_TOKEN=your_token ./test-upload.sh"
    exit 1
fi

# Create test image if not exists
TEST_IMAGE="test-image.jpg"
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${YELLOW}📝 Creating test image...${NC}"
    # Create a simple test image using ImageMagick (if available)
    if command -v convert &> /dev/null; then
        convert -size 100x100 xc:blue "$TEST_IMAGE"
        echo -e "${GREEN}✅ Test image created${NC}"
    else
        echo -e "${RED}❌ ImageMagick not found. Please provide a test image named 'test-image.jpg'${NC}"
        exit 1
    fi
fi

echo ""
echo "Configuration:"
echo "  BASE_URL: $BASE_URL"
echo "  TEST_IMAGE: $TEST_IMAGE"
echo ""

# Test function
test_upload() {
    local endpoint=$1
    local name=$2
    
    echo "Testing: $name"
    echo "  Endpoint: POST $BASE_URL$endpoint"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -F "image=@$TEST_IMAGE")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
        echo -e "  ${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "  Response: $body" | head -n 1
        
        # Extract URL if available
        url=$(echo "$body" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$url" ]; then
            echo -e "  ${GREEN}📸 Image URL: $url${NC}"
        fi
    else
        echo -e "  ${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "  Response: $body"
    fi
    
    echo ""
}

# Run tests
echo "🚀 Starting tests..."
echo ""

test_upload "/articles/upload" "Articles Upload"
test_upload "/products/upload" "Products Upload"
test_upload "/product-categories/upload" "Product Categories Upload"
test_upload "/waste-locations/upload" "Waste Locations Upload"

echo "=============================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check if all uploads succeeded"
echo "  2. Verify images are accessible via URLs"
echo "  3. Try creating/updating entities with uploaded image URLs"
echo ""

