#!/usr/bin/env python3
"""
Test script for Ollama connection
Helps verify Ollama is running and Llama 3.2 is available
"""

import sys
import requests

def test_ollama_connection():
    """Test the Ollama connection"""
    print("🔍 Testing Ollama Connection...")
    
    ollama_url = "http://localhost:11434"
    
    try:
        # Test if Ollama is running
        response = requests.get(f"{ollama_url}/api/tags")
        if response.status_code == 200:
            print("✅ Ollama server is running")
        else:
            print(f"❌ Ollama server returned status {response.status_code}")
            return False
        
        # Check available models
        models = response.json().get("models", [])
        model_names = [model.get("name", "") for model in models]
        
        print(f"📋 Available models: {', '.join(model_names)}")
        
        # Check if llama3.2 is available
        if "llama3.2:latest" in model_names:
            print("✅ Llama 3.2 model found")
            
            # Test the model
            print("🧪 Testing Llama 3.2...")
            test_response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": "Say 'Hello World'",
                    "stream": False
                },
                timeout=30
            )
            
            if test_response.status_code == 200:
                result = test_response.json()
                print(f"✅ Llama 3.2 is working!")
                print(f"📝 Response: {result.get('response', 'No response')}")
                return True
            else:
                print(f"❌ Llama 3.2 test failed with status {test_response.status_code}")
                return False
        else:
            print("❌ Llama 3.2 model not found")
            print("To install it, run: ollama pull llama3.2")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Ollama server")
        print("Make sure Ollama is running: ollama serve")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🤖 Ollama Connection Test")
    print("=" * 25)
    
    success = test_ollama_connection()
    
    if success:
        print("\n🎉 Ollama connection successful! You can now run the terminal agent.")
        print("Run: python terminal_agent.py")
    else:
        print("\n❌ Ollama connection failed. Please fix the issues above.")
        print("\nSetup instructions:")
        print("1. Install Ollama: https://ollama.ai")
        print("2. Start Ollama: ollama serve")
        print("3. Install Llama 3.2: ollama pull llama3.2")
        sys.exit(1)

if __name__ == "__main__":
    main()
