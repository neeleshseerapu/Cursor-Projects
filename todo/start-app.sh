#!/bin/bash

# UCLA Todo App - Start Script
# This script starts the server and opens the browser automatically

echo "🚀 Starting UCLA Todo App..."

# Check if we're in the right directory
if [ ! -f "server.js" ]; then
    echo "❌ Error: server.js not found. Please run this script from the todo directory."
    exit 1
fi

# Start the server in the background
echo "⏳ Starting server..."
node server.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
sleep 3

# Check if server is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Server is ready!"
    echo "🌐 Opening browser..."
    
    # Open browser based on OS
    case "$(uname -s)" in
        Darwin*)    # macOS
            open http://localhost:3001
            ;;
        Linux*)     # Linux
            xdg-open http://localhost:3001 2>/dev/null || sensible-browser http://localhost:3001 2>/dev/null || x-www-browser http://localhost:3001 2>/dev/null || echo "Please open http://localhost:3001 in your browser"
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)  # Windows
            start http://localhost:3001
            ;;
        *)          # Unknown OS
            echo "Please open http://localhost:3001 in your browser"
            ;;
    esac
else
    echo "⚠️  Server might not be ready yet. Please open http://localhost:3001 in your browser"
fi

echo ""
echo "🎯 UCLA Todo App is running at http://localhost:3001"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Wait for user to stop the server
wait $SERVER_PID
