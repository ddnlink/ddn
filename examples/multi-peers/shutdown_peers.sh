#!/bin/bash

# Default settings
BASE_PORT=8001
PEER_COUNT=3

# Help information
show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -n <number>    Number of peers to shutdown (default: 3)"
    echo "  -h            Show this help message"
}

# Parse parameters
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

# Shutdown nodes
shutdown_peers() {
    for i in $(seq 1 $PEER_COUNT); do
        local port=$((BASE_PORT + i - 1))
        echo "Shutting down peer on port $port..."
        
        # Find process running on the port
        local pid=$(lsof -ti :$port)
        if [ ! -z "$pid" ]; then
            echo "Found process $pid running on port $port"
            
            # Try graceful shutdown
            kill -15 $pid
            
            # Wait for process to terminate
            for j in {1..10}; do
                if ! kill -0 $pid 2>/dev/null; then
                    echo "Peer on port $port successfully shutdown"
                    break
                fi
                sleep 1
            done
            
            # Force kill if process still exists
            if kill -0 $pid 2>/dev/null; then
                echo "Force killing peer process $pid on port $port"
                kill -9 $pid
            fi
        else
            echo "No process found running on port $port"
        fi
    done
}

# Execute shutdown operation
echo "Shutting down $PEER_COUNT peers..."
shutdown_peers
echo "All peers shutdown completed" 