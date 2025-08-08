#!/bin/bash
# NPU Setup Script for Ollama
echo 'Setting up NPU configuration for Ollama...'

# Check for NPU devices
echo 'Checking for NPU devices:'
ls -la /dev/npu* 2>/dev/null || echo 'No Linux NPU devices found'
ls -la /dev/davinci* 2>/dev/null || echo 'No Ascend NPU devices found'
ls -la /dev/dxg 2>/dev/null && echo 'Windows DirectX Graphics device found (NPU support)'
ls -la /dev/accel* 2>/dev/null || echo 'No Intel accelerator devices found'

# Check CPU for Intel NPU support
echo 'Checking CPU for Intel NPU:'
grep -i "intel.*ultra\|intel.*core.*1[2-9][0-9]H" /proc/cpuinfo >/dev/null && echo 'Intel CPU with potential NPU support detected' || echo 'No Intel NPU-capable CPU detected'

# Create Ollama configuration directory
mkdir -p /root/.ollama/config

# Copy NPU configuration file if it exists
if [ -f /opt/ollama-config/npu.json ]; then
    cp /opt/ollama-config/npu.json /root/.ollama/config/
    echo 'NPU configuration file copied to Ollama config'
fi

# Set environment variables for NPU optimization
if ! grep -q "NPU Optimization Settings" /root/.bashrc 2>/dev/null; then
    cat >> /root/.bashrc << 'ENVS'
# NPU Optimization Settings
export OLLAMA_GPU_OVERHEAD=0
export OLLAMA_FLASH_ATTENTION=1
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_CONTEXT_LENGTH=4096
export OLLAMA_DEBUG=INFO
ENVS
    echo 'NPU environment variables added to .bashrc'
fi

echo 'NPU configuration completed!'
echo 'Configuration will persist across container restarts'