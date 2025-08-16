#!/bin/bash

# AIOT Centralized OPA Startup Script
# This script starts the centralized OPA services

echo "🚀 Starting AIOT Centralized OPA Services..."

# Change to the infrastructure directory
cd "$(dirname "$0")/../docker"

# Check if network exists, create if not
if ! docker network ls | grep -q "aiot-network"; then
    echo "📡 Creating aiot-network..."
    docker network create aiot-network
fi

# Start only OPA related services
echo "🔐 Starting OPA Policy Engine..."
docker-compose up -d aiot-opa

echo "📦 Starting OPA Bundle Server..." 
docker-compose up -d aiot-opa-bundle-server

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking OPA service health..."
if curl -s http://localhost:8181/health > /dev/null; then
    echo "✅ OPA Server is healthy"
else
    echo "❌ OPA Server is not responding"
    exit 1
fi

if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ OPA Bundle Server is healthy"
else
    echo "❌ OPA Bundle Server is not responding"  
    exit 1
fi

echo ""
echo "🎉 AIOT Centralized OPA Services Started Successfully!"
echo ""
echo "📊 Service URLs:"
echo "   • OPA Policy Engine: http://localhost:8181"
echo "   • OPA Bundle Server: http://localhost:8080"
echo ""
echo "🔧 Test Commands:"
echo "   curl http://localhost:8181/health"
echo "   curl http://localhost:8181/v1/policies"
echo ""
echo "📖 View logs:"
echo "   docker logs aiot-opa"
echo "   docker logs aiot-opa-bundle-server"