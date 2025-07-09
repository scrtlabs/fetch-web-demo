#!/bin/bash
# build.sh - Build and run the Medical Diagnostics Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="medical-diagnostics-platform"
CONTAINER_NAME="medical-diagnostics-web"
PORT="8080"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to create error pages if they don't exist
create_error_pages() {
    if [ ! -f "404.html" ]; then
        print_status "Creating 404.html error page..."
        cat > 404.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Not Found - Medical Diagnostics Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .error-container {
            max-width: 600px;
            padding: 2rem;
        }
        .error-code {
            font-size: 6rem;
            font-weight: 700;
            margin-bottom: 1rem;
            opacity: 0.8;
        }
        .error-title {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        .error-message {
            font-size: 1.125rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">404</div>
        <h1 class="error-title">Page Not Found</h1>
        <p class="error-message">
            The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" class="btn">🏥 Return to Dashboard</a>
    </div>
</body>
</html>
EOF
    fi

    if [ ! -f "50x.html" ]; then
        print_status "Creating 50x.html error page..."
        cat > 50x.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Error - Medical Diagnostics Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .error-container {
            max-width: 600px;
            padding: 2rem;
        }
        .error-code {
            font-size: 6rem;
            font-weight: 700;
            margin-bottom: 1rem;
            opacity: 0.8;
        }
        .error-title {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        .error-message {
            font-size: 1.125rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            display: inline-block;
            padding: 1rem 2rem;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">50x</div>
        <h1 class="error-title">Server Error</h1>
        <p class="error-message">
            We're experiencing technical difficulties. Please try again in a few moments.
        </p>
        <a href="/" class="btn">🏥 Return to Dashboard</a>
        <a href="javascript:location.reload()" class="btn">🔄 Retry</a>
    </div>
</body>
</html>
EOF
    fi
}

# Function to build the Docker image
build_image() {
    print_status "Building Docker image: $IMAGE_NAME"
    
    if docker build -t $IMAGE_NAME .; then
        print_success "Docker image built successfully"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
}

# Function to stop and remove existing container
cleanup_container() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Stopping existing container: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME
    fi
    
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        print_status "Removing existing container: $CONTAINER_NAME"
        docker rm $CONTAINER_NAME
    fi
}

# Function to run the container
run_container() {
    print_status "Starting container: $CONTAINER_NAME on port $PORT"
    
    # Create logs directory
    mkdir -p logs
    
    if docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        -v "$(pwd)/logs:/var/log/nginx" \
        $IMAGE_NAME; then
        print_success "Container started successfully"
        print_status "Application available at: http://localhost:$PORT"
    else
        print_error "Failed to start container"
        exit 1
    fi
}

# Function to show container status
show_status() {
    print_status "Container status:"
    docker ps -f name=$CONTAINER_NAME
    
    print_status "Container logs (last 10 lines):"
    docker logs --tail 10 $CONTAINER_NAME
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image only"
    echo "  run       Build and run the container"
    echo "  stop      Stop the running container"
    echo "  restart   Restart the container"
    echo "  logs      Show container logs"
    echo "  shell     Open a shell in the container"
    echo "  status    Show container status"
    echo "  clean     Stop and remove container and image"
    echo "  help      Show this help message"
    echo ""
    echo "If no command is provided, 'run' is executed by default."
}

# Main script logic
case "${1:-run}" in
    "build")
        check_docker
        create_error_pages
        build_image
        print_success "Build completed"
        ;;
    "run")
        check_docker
        create_error_pages
        cleanup_container
        build_image
        run_container
        show_status
        ;;
    "stop")
        print_status "Stopping container: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME
        print_success "Container stopped"
        ;;
    "restart")
        print_status "Restarting container: $CONTAINER_NAME"
        docker restart $CONTAINER_NAME
        print_success "Container restarted"
        show_status
        ;;
    "logs")
        print_status "Showing logs for container: $CONTAINER_NAME"
        docker logs -f $CONTAINER_NAME
        ;;
    "shell")
        print_status "Opening shell in container: $CONTAINER_NAME"
        docker exec -it $CONTAINER_NAME /bin/bash
        ;;
    "status")
        show_status
        ;;
    "clean")
        print_status "Cleaning up container and image"
        cleanup_container
        if docker images -q $IMAGE_NAME | grep -q .; then
            docker rmi $IMAGE_NAME
            print_success "Image removed"
        fi
        print_success "Cleanup completed"
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac