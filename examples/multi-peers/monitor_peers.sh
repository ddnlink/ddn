#!/bin/bash

PEER_COUNT=5
BASE_PORT=8001

check_peer_status() {
    local port=$1
    local response
    
    response=$(curl -s -m 30 "http://127.0.0.1:$port/api/blocks/getstatus")
    if [ $? -eq 0 ]; then
        local height=$(echo $response | jq -r '.height')
        local now=$(date +%s)
        local blockTime=$(echo $response | jq -r '.blockTime')
        
        if [ $((now - blockTime)) -gt 300 ]; then
            echo "节点 $port 超过5分钟未产生新区块"
            return 1
        fi
        echo "节点 $port 状态正常: $response"
        return 0
    else
        echo "节点 $port 状态异常"
        return 1
    fi
}

monitor_peers() {
    while true; do
        echo "=============== $(date) ==============="
        
        local unhealthy_count=0
        for i in $(seq 1 $PEER_COUNT); do
            local port=$((BASE_PORT + i - 1))
            if ! check_peer_status $port; then
                ((unhealthy_count++))
            fi
        done
        
        if [ $unhealthy_count -gt 0 ]; then
            echo "发现 $unhealthy_count 个异常节点，准备重启..."
            sh ./stop_peers.sh -n $PEER_COUNT
            sh ./clean_peers.sh -t db
            sh ./start_peers.sh -n $PEER_COUNT -f
        fi
        
        sleep 60
    done
}

monitor_peers 