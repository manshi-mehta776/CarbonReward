#!/bin/bash
set -e

cd contracts

echo "==> Building contracts..."
stellar contract build

# Ensure deployer keys exist
if ! stellar keys ls | grep -q "deployer"; then
    echo "Generating deployer keys..."
    stellar keys generate deployer --network testnet --fund
fi

DEPLOYER="deployer"

echo "==> Deploying Campaign Contract..."
# Build process outputs campaign_contract.wasm instead of campaign-contract.wasm usually, let's optimize it first just to be safe
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campaign_contract.wasm

CONTRACT_ID=$(stellar contract deploy --wasm target/wasm32-unknown-unknown/release/campaign_contract.optimized.wasm --source $DEPLOYER --network testnet)
echo "Campaign Contract deployed at: $CONTRACT_ID"

echo ""
echo "=================================================="
echo " Deployment complete"
echo "=================================================="
echo " CAMPAIGN_CONTRACT_ID: $CONTRACT_ID"
echo "=================================================="
