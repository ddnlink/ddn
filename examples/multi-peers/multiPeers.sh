#!/bin/bash

# 默认值设置
PEER_COUNT=3
TEMPLATE_DIR="../../examples/fun-tests"
BASE_PORT=8001
P2P_BASE_PORT=9001
TOTAL_SECRETS=101
SECRET_START_LINE=40
SECRET_END_LINE=140

# 帮助信息
show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -n <number>    Number of peers to start (default: 3)"
    echo "  -h            Show this help message"
}

# 参数解析
while getopts "n:h" opt; do
    case $opt in
        n)
            PEER_COUNT=$OPTARG
            if ! [[ "$PEER_COUNT" =~ ^[0-9]+$ ]] || [ "$PEER_COUNT" -lt 1 ]; then
                echo "Error: Peer count must be a positive number"
                exit 1
            fi
            ;;
        h)
            show_help
            exit 0
            ;;
        \?)
            echo "Invalid option: -$OPTARG"
            show_help
            exit 1
            ;;
    esac
done

# 检查并创建基础目录
check_and_create_dirs() {
    # 检查模板目录是否存在
    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo "Error: Template directory $TEMPLATE_DIR does not exist"
        exit 1
    fi

    # 为每个节点创建目录并复制模板内容
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="../peer-$((BASE_PORT + i - 1))"
        if [ ! -d "$peer_dir" ]; then
            echo "Creating peer directory: $peer_dir"
            cp -r "$TEMPLATE_DIR" "$peer_dir"
            
            # 安装依赖
            # (
            #     cd "$peer_dir" || exit
            #     echo "Installing dependencies for $peer_dir..."
                
            #     # 降级 uuid 到兼容版本
            #     if [ -f "package.json" ]; then
            #         # 使用临时文件进行修改
            #         jq '.dependencies.uuid = "^8.3.2"' package.json > temp.json && mv temp.json package.json
            #     fi
                
            #     # 安装 request
            #     pnpm install request --save
                
            #     # 重新安装所有依赖
            #     pnpm install
            # )
        fi
    done
}

# 分配密钥给节点
distribute_secrets() {
    local peer_dir=$1
    local peer_index=$2
    local secrets_per_peer=$(( TOTAL_SECRETS / PEER_COUNT ))
    local start_line=$(( SECRET_START_LINE + (peer_index - 1) * secrets_per_peer ))
    local end_line=$(( start_line + secrets_per_peer - 1 ))
    
    if [ $peer_index -eq $PEER_COUNT ]; then
        end_line=$SECRET_END_LINE
    fi
    
    local temp_file=$(mktemp)
    if [ -f "$peer_dir/.ddnrc.js" ]; then
        head -n $(( SECRET_START_LINE - 1 )) "$peer_dir/.ddnrc.js" > "$temp_file"
        sed -n "${start_line},${end_line}p" "$peer_dir/.ddnrc.js" >> "$temp_file"
        tail -n +$(( SECRET_END_LINE + 1 )) "$peer_dir/.ddnrc.js" >> "$temp_file"
        mv "$temp_file" "$peer_dir/.ddnrc.js"
    fi
}

# 配置文件准备
prepare_config_files() {
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="peer-$((BASE_PORT + i - 1))"
        local http_port=$((BASE_PORT + i - 1))
        local p2p_port=$((P2P_BASE_PORT + i - 1))
        
        # 更新端口配置
        sed -i.bak "s/port: ${BASE_PORT}/port: ${http_port}/" "$peer_dir/.ddnrc.js"
        sed -i.bak "s/p2pPort: ${P2P_BASE_PORT}/p2pPort: ${p2p_port}/" "$peer_dir/.ddnrc.js"
        
        # 更新 peers 列表 - 包含所有节点
        local peers_list=""
        for j in $(seq 1 $PEER_COUNT); do
            # 排除自己
            if [ $j -ne $i ]; then
                peers_list="${peers_list} { ip: '127.0.0.1', port: '$((P2P_BASE_PORT + j - 1))' },"
            fi
        done
        
        # 替换 peers 配置
        sed -i.bak "s/{ ip: '127.0.0.1', port: '9001' },/${peers_list%,*}/" "$peer_dir/.ddnrc.js"
        # 清理备份文件
        rm -f "$peer_dir/.ddnrc.js.bak"
        
        # 分配密钥
        distribute_secrets "$peer_dir" $i
    done
}

# 节点健康检查
check_peer_health() {
    local peer_dir=$1
    local port=$(grep "port:" "$peer_dir/.ddnrc.js" | head -n1 | awk '{print $2}' | tr -d ',')
    
    for i in {1..10}; do
        if curl -s "http://localhost:$port/api/status" > /dev/null; then
            echo "Peer on port $port is healthy"
            return 0
        fi
        sleep 1
    done
    
    echo "Peer on port $port failed health check"
    return 1
}

# 启动节点
start_peers() {
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="peer-$((BASE_PORT + i - 1))"
        echo "Starting peer in $peer_dir..."
        
        node "$peer_dir/app.js" --base "$peer_dir" --daemon
        
        if ! check_peer_health "$peer_dir"; then
            echo "Failed to start peer in $peer_dir"
            shutdown_peers
            exit 1
        fi
        
        sleep 3
    done
}

# 优雅关闭节点
shutdown_peers() {
    echo "Shutting down peers..."
    for pid in $(ps aux | grep app.js | grep -v grep | awk '{print $2}'); do
        kill -15 $pid
        
        for i in {1..10}; do
            if ! kill -0 $pid 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing peer process $pid"
            kill -9 $pid
        fi
    done
}

# 主流程
main() {
    echo "Starting $PEER_COUNT peers..."
    
    # 检查必要的命令是否存在
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed. Please install jq first."
        echo "On macOS: brew install jq"
        echo "On Ubuntu: sudo apt-get install jq"
        exit 1
    fi
    
    check_and_create_dirs
    prepare_config_files
    start_peers
    
    echo "All peers started successfully"
    sleep 10
    
    # 运行测试
    # pnpm test
}

# 确保清理工作始终执行
trap shutdown_peers EXIT INT TERM

# 执行主流程
main
