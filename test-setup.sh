#!/bin/bash

echo "🔍 Testing 0G Verifiable AI Infrastructure"
echo "=========================================="

# Test 1: Worker Health
echo ""
echo "1️⃣  Testing Worker Health (localhost:3001)..."
WORKER_HEALTH=$(curl -s http://localhost:3001/health)
if [ $? -eq 0 ]; then
    echo "✅ Worker is running"
    echo "   Response: $WORKER_HEALTH"
else
    echo "❌ Worker is NOT running"
    echo "   → Run: cd worker && npm start"
fi

# Test 2: Frontend
echo ""
echo "2️⃣  Testing Frontend (localhost:3005)..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005)
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is NOT running"
    echo "   → Run: cd frontend && npm run dev"
fi

# Test 3: Contract on 0G Galileo
echo ""
echo "3️⃣  Testing Contract Connection..."
echo "   Contract: 0x915cc86fe0871835e750e93e025080fff9927a3f"
echo "   Network: 0G Galileo Testnet (Chain ID: 16602)"
echo "   RPC: https://evmrpc-testnet.0g.ai"

# Test 4: Worker Registration
echo ""
echo "4️⃣  Testing Worker Registration Endpoint..."
TEST_PROMPT="Test prompt"
REG_RESPONSE=$(curl -s -X POST http://localhost:3001/register-prompt \
  -H "Content-Type: application/json" \
  -d '{"requestId": 999999, "prompt": "'"$TEST_PROMPT"'", "promptHash": "0x1234"}')

if echo "$REG_RESPONSE" | grep -q "ok"; then
    echo "✅ Worker registration endpoint working"
else
    echo "⚠️  Worker registration issue: $REG_RESPONSE"
fi

echo ""
echo "=========================================="
echo "🎉 Setup Check Complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Open http://localhost:3005 in your browser"
echo "   2. Connect your wallet to 0G Galileo Testnet"
echo "      - Network Name: 0G Galileo Testnet"
echo "      - RPC URL: https://evmrpc-testnet.0g.ai"
echo "      - Chain ID: 16602"
echo "      - Symbol: GO"
echo "   3. Get testnet tokens from 0G faucet"
echo "   4. Enter a prompt and click Generate!"
echo ""
