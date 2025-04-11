#!/bin/bash

# 默认设置
PEER_COUNT=5
BASE_PORT=8001
CLEAN_TYPE="all"
CLEAN_FILE=""

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -n <数字>     要清理的节点数量 (默认: 5)"
    echo "  -t <类型>     清理类型 (db|log|all, 默认: all)"
    echo "  -f <文件名>   指定要清理的文件 (debug|dvm|main|blockchain|peer)"
    echo "  -h           显示帮助信息"
}

# 解析参数
while getopts "n:t:f:h" opt; do
    case $opt in
        n)
            PEER_COUNT=$OPTARG
            if ! [[ "$PEER_COUNT" =~ ^[0-9]+$ ]] || [ "$PEER_COUNT" -lt 1 ]; then
                echo "错误: 节点数量必须是正整数"
                exit 1
            fi
            ;;
        t)
            CLEAN_TYPE=$OPTARG
            if [[ "$CLEAN_TYPE" != "db" && "$CLEAN_TYPE" != "log" && "$CLEAN_TYPE" != "pid" && "$CLEAN_TYPE" != "all" ]]; then
                echo "错误: 清理类型必须是 db、log、pid 或 all"
                exit 1
            fi
            ;;
        f)
            CLEAN_FILE=$OPTARG
            if [[ "$CLEAN_FILE" != "debug" && "$CLEAN_FILE" != "dvm" && "$CLEAN_FILE" != "main" && \
                  "$CLEAN_FILE" != "blockchain" && "$CLEAN_FILE" != "peer" ]]; then
                echo "错误: 文件名必须是 debug、dvm、main、blockchain 或 peer"
                exit 1
            fi
            ;;
        h)
            show_help
            exit 0
            ;;
        \?)
            echo "无效选项: -$OPTARG"
            show_help
            exit 1
            ;;
    esac
done

# 清理指定文件
clean_specific_file() {
    local peer_dir=$1
    local file_name=$2
    
    case $file_name in
        "debug")
            rm -f "$peer_dir/logs/debug.log"
            echo "已清理 $peer_dir/logs/debug.log"
            ;;
        "dvm")
            rm -f "$peer_dir/logs/dvm.log"
            echo "已清理 $peer_dir/logs/dvm.log"
            ;;
        "main")
            rm -f "$peer_dir/logs/main.log"
            echo "已清理 $peer_dir/logs/main.log"
            ;;
        "blockchain")
            rm -f "$peer_dir/db/blockchain.db"
            echo "已清理 $peer_dir/db/blockchain.db"
            ;;
        "peer")
            rm -f "$peer_dir/db/peer.db"
            echo "已清理 $peer_dir/db/peer.db"
            ;;
    esac
}

# 清理数据库文件
clean_db() {
    local peer_dir=$1
    # 确保进程已停止
    local port=$(echo $peer_dir | grep -o '[0-9]\+$')
    if lsof -i :$port >/dev/null; then
        echo "警告: 端口 $port 仍在运行，请先停止节点"
        return 1
    fi
    
    rm -f "$peer_dir/db/blockchain.db" "$peer_dir/db/peer.db"
    rm -f "$peer_dir/db/delegates.db"  # 添加受托人数据库清理
    echo "已清理数据库文件: $peer_dir/db/"
}

# 清理日志文件
clean_logs() {
    local peer_dir=$1
    rm -f "$peer_dir/logs/debug.log" "$peer_dir/logs/dvm.log" "$peer_dir/logs/main.log"
    echo "已清理日志文件: $peer_dir/logs/"
}

# 清理pid文件
clean_pids() {
    local peer_dir=$1
    rm -f "$peer_dir/ddn.pid"
    echo "已清理pid文件: $peer_dir/ddn.pid"
}

# 主要清理过程
main() {
    echo "开始清理 $PEER_COUNT 个节点..."
    
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="../peer-$((BASE_PORT + i - 1))"
        
        if [ ! -d "$peer_dir" ]; then
            echo "警告: 目录 $peer_dir 不存在，跳过..."
            continue
        fi
        
        if [ ! -z "$CLEAN_FILE" ]; then
            clean_specific_file "$peer_dir" "$CLEAN_FILE"
        else
            case $CLEAN_TYPE in
                "db")
                    clean_db "$peer_dir"
                    ;;
                "log")
                    clean_logs "$peer_dir"
                    ;;
                "pid")
                    clean_pids "$peer_dir"
                    ;;
                "all")
                    clean_db "$peer_dir"
                    clean_logs "$peer_dir"
                    clean_pids "$peer_dir"
                    echo "已清理所有文件: $peer_dir"
                    ;;
            esac
        fi
    done
    
    echo "清理完成"
}

# 执行主程序
main 