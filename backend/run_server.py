#!/usr/bin/env python3
import subprocess
import os
import signal
import sys
import time
import socket

def get_network_ip():
    """Get the local network IP address"""
    try:
        # Create a socket to get the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Connect to an external address (doesn't actually send data)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_free_port(start_port):
    port = start_port
    while is_port_in_use(port):
        print(f"Port {port} is in use, trying next port...")
        port += 1
    return port

def cleanup(backend_proc, frontend_proc):
    print("\nStopping all services...")
    if backend_proc:
        backend_proc.terminate()
    if frontend_proc:
        frontend_proc.terminate()
    print("Services stopped.")
    sys.exit(0)

if __name__ == "__main__":
    backend_proc = None
    frontend_proc = None
    
    def signal_handler(sig, frame):
        cleanup(backend_proc, frontend_proc)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Find free ports
        backend_port = find_free_port(8001)
        frontend_port = find_free_port(3000)
        
        # Get parent directory (project root)
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        backend_dir = os.path.join(project_root, "backend")
        frontend_dir = os.path.join(project_root, "frontend")
        
        # Start backend
        print(f"Starting backend on port {backend_port}...")
        backend_proc = subprocess.Popen([
            "python3", "-m", "uvicorn", "main:app", 
            "--reload", "--host", "0.0.0.0", "--port", str(backend_port)
        ], cwd=backend_dir)
        
        time.sleep(2)
        
        # Start frontend
        print(f"Starting frontend on port {frontend_port}...")
        env = os.environ.copy()
        env["DANGEROUSLY_DISABLE_HOST_CHECK"] = "true"
        env["PORT"] = str(frontend_port)
        
        frontend_proc = subprocess.Popen([
            "npm", "start"
        ], cwd=frontend_dir, env=env)
        
        # Get network IP
        network_ip = get_network_ip()
        
        print("\n" + "=" * 70)
        print("  🚀 MATCH POINT SERVER STARTED")
        print("=" * 70)
        print("\n📡 BACKEND API:")
        print(f"   Local:   http://localhost:{backend_port}")
        if network_ip:
            print(f"   Network: http://{network_ip}:{backend_port}")
        print("\n🌐 FRONTEND:")
        print(f"   Local:   http://localhost:{frontend_port}")
        if network_ip:
            print(f"   Network: http://{network_ip}:{frontend_port}")
        print("\n" + "=" * 70)
        print("Press Ctrl+C to stop all services")
        print("=" * 70 + "\n")
        
        # Wait for processes
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                print("One of the services stopped unexpectedly")
                break
                
    except KeyboardInterrupt:
        cleanup(backend_proc, frontend_proc)
    except Exception as e:
        print(f"Error: {e}")
        cleanup(backend_proc, frontend_proc)