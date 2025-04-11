#!/bin/bash

# Default settings
PEER_COUNT=5
TEMPLATE_DIR="../../examples/fun-tests" # 主网使用 main-tests 模板
BASE_PORT=8001
P2P_BASE_PORT=9001
TOTAL_SECRETS=101 # 总密钥数量
SECRET_START_LINE=40 # 针对 .ddnrc.js 文件，节点密钥的第一行位置: 40
SECRET_END_LINE=$((SECRET_START_LINE + TOTAL_SECRETS - 1))  # 根据密钥数量计算结束行

FORCE_MODE=false
SPECIFIC_PEER=""

# Help information
show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -n <number>    Number of peers to start (default: 5)"
    echo "  -p <name>     Specific peer name to start (e.g., peer-8001 or 8001)"
    echo "  -m <network>  Network type (mainnet) to use main-tests template"
    echo "  -s <number>    Total number of secrets (default: 101)"
    echo "  -f            Force mode - delete existing peer directories and recreate"
    echo "  -h            Show this help message"
}

# Parse parameters
while getopts "n:p:fm:s:h" opt; do
    case $opt in
        m)
            if [ "$OPTARG" = "mainnet" ]; then
                TEMPLATE_DIR="../../examples/main-tests"
            else
                echo "Error: Invalid network type. Use 'mainnet' for mainnet template"
                exit 1
            fi
            ;;
        n)
            PEER_COUNT=$OPTARG
            if ! [[ "$PEER_COUNT" =~ ^[0-9]+$ ]] || [ "$PEER_COUNT" -lt 1 ]; then
                echo "Error: Peer count must be a positive number"
                exit 1
            fi
            ;;
        f)
            FORCE_MODE=true
            ;;
        p)
            # Convert simple port number to peer-PORT format if needed
            if [[ "$OPTARG" =~ ^[0-9]+$ ]]; then
                SPECIFIC_PEER="peer-$OPTARG"
            else
                SPECIFIC_PEER=$OPTARG
            fi
            
            # Validate the peer name format
            if [[ ! "$SPECIFIC_PEER" =~ ^peer-[0-9]+$ ]]; then
                echo "Error: Peer name must be either a port number (e.g., 8001) or in format 'peer-PORT' (e.g., peer-8001)"
                exit 1
            fi
            ;;
        s)
            TOTAL_SECRETS=$OPTARG
            if ! [[ "$TOTAL_SECRETS" =~ ^[0-9]+$ ]] || [ "$TOTAL_SECRETS" -lt 1 ]; then
                echo "Error: Secret count must be a positive number"
                exit 1
            fi
            SECRET_END_LINE=$((SECRET_START_LINE + TOTAL_SECRETS - 1))
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

# Check and create base directories
check_and_create_dirs() {
    # Check if template directory exists
    if [ ! -d "$TEMPLATE_DIR" ]; then
        echo "Error: Template directory $TEMPLATE_DIR does not exist"
        exit 1
    fi

    if [ -n "$SPECIFIC_PEER" ]; then
        local port=$(echo "$SPECIFIC_PEER" | grep -o '[0-9]\+')
        local peer_dir="../peer-$port"
        if [ "$FORCE_MODE" = true ] && [ -d "$peer_dir" ]; then
            echo "Force mode enabled, removing directory $peer_dir..."
            rm -rf "$peer_dir"
        fi
        if [ ! -d "$peer_dir" ]; then
            echo "Creating peer directory: $peer_dir"
            rsync -a "$TEMPLATE_DIR/" "$peer_dir"
        elif [ "$FORCE_MODE" = false ]; then
            echo "Directory $peer_dir already exists, skipping... (use -f to force recreate)"
        fi
        return
    fi

    # If force mode is enabled, remove existing peer directories
    if [ "$FORCE_MODE" = true ]; then
        echo "Force mode enabled, removing existing peer directories..."
        for i in $(seq 1 $PEER_COUNT); do
            local peer_dir="../peer-$((BASE_PORT + i - 1))"
            if [ -d "$peer_dir" ]; then
                echo "Removing directory: $peer_dir"
                rm -rf "$peer_dir"
            fi
        done
    fi

    # Create directory for each peer and copy template content
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="../peer-$((BASE_PORT + i - 1))"
        if [ ! -d "$peer_dir" ]; then
            echo "Creating peer directory: $peer_dir"
            rsync -a "$TEMPLATE_DIR/" "$peer_dir"
        elif [ "$FORCE_MODE" = false ]; then
            echo "Directory $peer_dir already exists, skipping... (use -f to force recreate)"
        fi
    done
}

# Distribute secrets to nodes
distribute_secrets() {
    local peer_dir=$1
    local peer_index=$2
    
    # Check if secrets have already been distributed
    if [ -f "$peer_dir/.secrets_distributed" ]; then
        echo "Secrets already distributed for $peer_dir, skipping..."
        return 0
    fi
    
    local secrets_per_peer=$(( TOTAL_SECRETS / PEER_COUNT ))
    
    # Use temporary file for replacement
    local temp_file=$(mktemp)
    
    if [ -f "$peer_dir/.ddnrc.js" ]; then
        awk -v start=$SECRET_START_LINE -v end=$SECRET_END_LINE \
            -v peer_idx=$peer_index -v peer_count=$PEER_COUNT \
            -v total=$TOTAL_SECRETS '
        # Calculate secret range for current node
        BEGIN {
            secrets_per_peer = int(total / peer_count)
            start_idx = (peer_idx - 1) * secrets_per_peer + start
            end_idx = (peer_idx == peer_count) ? end : (start_idx + secrets_per_peer - 1)
        }
        # Print line if within secret area and within node range
        NR >= start && NR <= end {
            if (NR >= start_idx && NR <= end_idx) {
                print
            }
            next
        }
        # Print all other lines
        {
            print
        }' "$peer_dir/.ddnrc.js" > "$temp_file"
        
        mv "$temp_file" "$peer_dir/.ddnrc.js"
        
        # Mark secrets as distributed
        touch "$peer_dir/.secrets_distributed"
    fi
}

# Prepare configuration files
prepare_config_files() {
    if [ -n "$SPECIFIC_PEER" ]; then
        local port=$(echo "$SPECIFIC_PEER" | grep -o '[0-9]\+')
        local peer_dir="../peer-$port"
        if [ -f "$peer_dir/.config_prepared" ] && [ "$FORCE_MODE" != true ]; then
            echo "Configuration already prepared for $peer_dir, skipping..."
            return
        fi
        local http_port=$port
        local p2p_port=$((P2P_BASE_PORT + (port - BASE_PORT)))
            
        # Update port configuration
        sed -i.bak "s/port: ${BASE_PORT}/port: ${http_port}/" "$peer_dir/.ddnrc.js"
        sed -i.bak "s/p2pPort: ${P2P_BASE_PORT}/p2pPort: ${p2p_port}/" "$peer_dir/.ddnrc.js"
        
        # Mark configuration as completed
        touch "$peer_dir/.config_prepared"
        
        # Clean up backup files
        rm -f "$peer_dir/.ddnrc.js.bak"
        return
    fi

    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="../peer-$((BASE_PORT + i - 1))"
        
        # Skip if directory exists and is already configured
        if [ -f "$peer_dir/.config_prepared" ]; then
            echo "Configuration already prepared for $peer_dir, skipping..."
            continue
        fi
        
        local http_port=$((BASE_PORT + i - 1))
        local p2p_port=$((P2P_BASE_PORT + i - 1))
        
        # Update port configuration
        sed -i.bak "s/port: ${BASE_PORT}/port: ${http_port}/" "$peer_dir/.ddnrc.js"
        sed -i.bak "s/p2pPort: ${P2P_BASE_PORT}/p2pPort: ${p2p_port}/" "$peer_dir/.ddnrc.js"
        
        # Update peers list - include all nodes
        local peers_list=""
        for j in $(seq 1 $PEER_COUNT); do
            # Exclude self
            if [ $j -ne $i ]; then
                # peers_list="${peers_list}{ ip: '127.0.0.1', port: '$((P2P_BASE_PORT + j - 1))' }, "
                peers_list="${peers_list}{ ip: '127.0.0.1', port: '$((P2P_BASE_PORT + j - 1))', httpPort: '$((BASE_PORT + j - 1))' }, "
            fi
        done
        
        # Remove last comma and space
        peers_list=${peers_list%, }
        
        # Use temporary file for replacement to avoid multiple sed operations
        local temp_file=$(mktemp)
        awk -v peers="$peers_list" '
        /peers: {/ {
            print "    peers: {"
            print "        list: ["
            print "            " peers
            print "        ],"
            in_peers=1
            next
        }
        in_peers && /]/ {
            in_peers=0
            next
        }
        !in_peers {
            print
        }' "$peer_dir/.ddnrc.js" > "$temp_file"
        
        mv "$temp_file" "$peer_dir/.ddnrc.js"
        
        # Distribute secrets
        distribute_secrets "$peer_dir" $i
        
        # Mark configuration as completed
        touch "$peer_dir/.config_prepared"
        
        # Clean up backup files
        rm -f "$peer_dir/.ddnrc.js.bak"
    done
}

# Check node health
check_peer_health() {
    local peer_dir=$1
    local port=$(grep "port:" "$peer_dir/.ddnrc.js" | head -n1 | awk '{print $2}' | tr -d ',')
    
    for i in {1..10}; do
        if curl -s "http://localhost:$port/api/blocks/getstatus" > /dev/null; then
            echo "Peer on port $port is healthy"
            return 0
        fi
        sleep 1
    done
    
    echo "Peer on port $port failed health check"
    return 1
}

# Start nodes
start_peers() {
    # Save current directory
    CURRENT_DIR=$(pwd)
    
    if [ -n "$SPECIFIC_PEER" ]; then
        local port=$(echo "$SPECIFIC_PEER" | grep -o '[0-9]\+')
        if [ -d "../$SPECIFIC_PEER" ]; then
            start_single_peer "../$SPECIFIC_PEER"
        else
            echo "Error: Peer directory ../$SPECIFIC_PEER does not exist"
            exit 1
        fi
        return
    fi
    
    for i in $(seq 1 $PEER_COUNT); do
        local peer_dir="../peer-$((BASE_PORT + i - 1))"
        echo "Starting peer in $peer_dir..."
        
        # Change to node directory
        cd "$peer_dir" || exit
        
                start_single_peer "$peer_dir"
    done
}

# Start a single peer
start_single_peer() {
    local peer_dir=$1
    cd "$peer_dir" || exit
    
    # Start node using relative path
    node --experimental-vm-modules app.js --daemon
    
    if ! check_peer_health "$peer_dir"; then
        echo "Failed to start peer in $peer_dir"
        cd "$CURRENT_DIR"
        local port=$(echo "$peer_dir" | grep -o '[0-9]\+')
        local pid=$(lsof -ti :$port)
        if [ -n "$pid" ]; then
            if ps -p $pid > /dev/null; then
                echo "Killing process $pid"
                kill -9 $pid
            fi
        fi
        exit 1
    fi
    
    # Return to original directory
    cd "$CURRENT_DIR" || exit
    
    sleep 3
}

# Main process
main() {
    if [ -n "$SPECIFIC_PEER" ]; then
        echo "Starting peer $SPECIFIC_PEER..."
    else
        echo "Starting $PEER_COUNT peers..."
    fi
    
    # Check if required commands exist
    # if ! command -v jq &> /dev/null; then
    #     echo "Error: jq is required but not installed. Please install jq first."
    #     echo "On macOS: brew install jq"
    #     echo "On Ubuntu: sudo apt-get install jq"
    #     exit 1
    # fi
    
    check_and_create_dirs
    prepare_config_files
    start_peers
    
    if [ -n "$SPECIFIC_PEER" ]; then
        echo "Peer $SPECIFIC_PEER started successfully"
        echo "To shutdown the peer, run: sh ./stop_peers.sh -p $SPECIFIC_PEER"
    else
        echo "All peers started successfully"
        echo "To shutdown peers, run: sh ./stop_peers.sh -n $PEER_COUNT"
    fi
}

# Execute main process
main
