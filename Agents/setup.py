#!/usr/bin/env python3
"""
Setup script for AI Terminal Agent
Helps users set up Ollama and Llama 3.2
"""

import os
import sys
import subprocess
from pathlib import Path

def check_ollama_installation():
    """Check if Ollama is installed"""
    try:
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Ollama is installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ Ollama is not working properly")
            return False
    except FileNotFoundError:
        print("❌ Ollama is not installed")
        return False

def install_ollama():
    """Provide instructions to install Ollama"""
    print("\n📦 Ollama Installation Instructions:")
    print("1. Visit https://ollama.ai")
    print("2. Download and install Ollama for your system")
    print("3. After installation, run: ollama serve")
    print("4. Then run: ollama pull llama3.2")
    
    install_now = input("\nDo you want to install Ollama now? (y/n): ").strip().lower()
    if install_now in ['y', 'yes']:
        print("\nPlease follow the installation instructions above.")
        print("After installation, run this setup script again.")
        return False
    return False

def check_ollama_server():
    """Check if Ollama server is running"""
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama server is running")
            return True
        else:
            print("❌ Ollama server is not responding properly")
            return False
    except Exception:
        print("❌ Ollama server is not running")
        return False

def install_llama_model():
    """Install Llama 3.2 model"""
    print("\n📥 Installing Llama 3.2 model...")
    print("This may take a few minutes depending on your internet connection...")
    
    try:
        result = subprocess.run(['ollama', 'pull', 'llama3.2'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Llama 3.2 model installed successfully!")
            return True
        else:
            print(f"❌ Failed to install model: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error installing model: {str(e)}")
        return False

def install_dependencies():
    """Install required Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    
    try:
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Python dependencies installed successfully!")
            return True
        else:
            print(f"❌ Failed to install dependencies: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error installing dependencies: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🤖 AI Terminal Agent Setup (Ollama)")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path('terminal_agent.py').exists():
        print("❌ Error: Please run this script from the Agents directory")
        sys.exit(1)
    
    # Install Python dependencies
    if not install_dependencies():
        print("❌ Setup failed. Please install dependencies manually:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    
    # Check Ollama installation
    if not check_ollama_installation():
        if not install_ollama():
            print("\n❌ Setup incomplete. Please install Ollama first.")
            sys.exit(1)
        return
    
    # Check if Ollama server is running
    if not check_ollama_server():
        print("\n⚠️  Ollama server is not running.")
        print("Please start Ollama with: ollama serve")
        print("Then run this setup script again.")
        sys.exit(1)
    
    # Install Llama 3.2 model
    if not install_llama_model():
        print("\n❌ Failed to install Llama 3.2 model.")
        print("Please try running: ollama pull llama3.2")
        sys.exit(1)
    
    print("\n🎉 Setup complete!")
    print("\nTo run the agent:")
    print("python terminal_agent.py")
    print("\nMake sure Ollama is running:")
    print("ollama serve")

if __name__ == "__main__":
    main()
