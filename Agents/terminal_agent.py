#!/usr/bin/env python3
"""
AI Terminal Agent
Converts natural language to terminal commands using Ollama's Llama 3.2
"""

import os
import subprocess
import sys
import json
import requests
from typing import List, Dict, Any
from pathlib import Path

class TerminalAgent:
    def __init__(self):
        """Initialize the terminal agent with Ollama"""
        self.ollama_url = "http://localhost:11434"
        
        # Initialize conversation history
        self.conversation_history = []
        self.max_history_length = 10  # Keep last 10 exchanges
        
        # Track current working directory
        self.current_working_dir = os.getcwd()
        
        # Test Ollama connection
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            if response.status_code == 200:
                print("✅ Successfully connected to Ollama")
            else:
                raise Exception(f"Ollama server returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            raise Exception("Could not connect to Ollama. Make sure Ollama is running on localhost:11434")
        except Exception as e:
            raise Exception(f"Error connecting to Ollama: {str(e)}")
        
        # Check if llama3.2 model is available
        try:
            response = requests.get(f"{self.ollama_url}/api/tags")
            models = response.json().get("models", [])
            model_names = [model.get("name", "") for model in models]
            
            if "llama3.2:latest" in model_names:
                print("✅ Llama 3.2 model found")
            else:
                print("⚠️  Llama 3.2 model not found. Available models:")
                for model in models:
                    print(f"  - {model.get('name', 'Unknown')}")
                print("\nTo install Llama 3.2, run: ollama pull llama3.2")
                raise Exception("Llama 3.2 model not available")
                
        except Exception as e:
            raise Exception(f"Error checking models: {str(e)}")
        
        # Define system prompt for safe command generation
        self.system_prompt = """
You are a helpful AI assistant that converts natural language requests into safe terminal commands.
Your role is to:
1. Understand what the user wants to do
2. Generate appropriate terminal commands
3. ONLY generate safe commands (no destructive operations)
4. Provide clear explanations
5. Remember previous commands and context from the conversation

IMPORTANT SAFETY RULES:
- NEVER generate commands like 'rm -rf /', 'format', 'dd', or any destructive operations
- NEVER generate commands that could harm the system
- ONLY generate commands for file operations, system info, and safe utilities
- If unsure about safety, ask for clarification

Respond with a JSON object containing:
{
    "command": "the terminal command to run",
    "explanation": "what this command does",
    "is_safe": true/false,
    "warning": "any safety warnings (if applicable)"
}
"""

    def add_to_history(self, user_input: str, ai_response: Dict[str, Any], command_result: Dict[str, Any]):
        """Add an exchange to the conversation history"""
        exchange = {
            "user_input": user_input,
            "ai_response": ai_response,
            "command_result": command_result,
            "timestamp": subprocess.run(['date'], capture_output=True, text=True).stdout.strip()
        }
        
        self.conversation_history.append(exchange)
        
        # Keep only the last max_history_length exchanges
        if len(self.conversation_history) > self.max_history_length:
            self.conversation_history = self.conversation_history[-self.max_history_length:]

    def build_context_prompt(self, user_input: str) -> str:
        """Build a prompt that includes conversation history for context"""
        context_parts = [self.system_prompt]
        
        # Add current working directory context
        context_parts.append(f"\nCURRENT WORKING DIRECTORY: {self.current_working_dir}")
        
        if self.conversation_history:
            context_parts.append("\n\nCONVERSATION HISTORY:")
            for i, exchange in enumerate(self.conversation_history[-3:], 1):  # Last 3 exchanges
                context_parts.append(f"\n--- Exchange {i} ---")
                context_parts.append(f"User: {exchange['user_input']}")
                context_parts.append(f"AI Command: {exchange['ai_response'].get('command', 'N/A')}")
                context_parts.append(f"Result: {'Success' if exchange['command_result'].get('success') else 'Failed'}")
                if exchange['command_result'].get('stdout'):
                    context_parts.append(f"Output: {exchange['command_result']['stdout'][:100]}...")
        
        context_parts.append(f"\n\nCurrent User Request: {user_input}")
        context_parts.append("\nGenerate a safe terminal command:")
        
        return "\n".join(context_parts)

    def generate_command(self, user_input: str) -> Dict[str, Any]:
        """Generate terminal command from natural language input using Ollama with history"""
        try:
            # Build prompt with conversation history
            prompt = self.build_context_prompt(user_input)
            
            # Call Ollama API
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API returned status {response.status_code}")
            
            response_data = response.json()
            ai_response = response_data.get("response", "")
            
            # Try to parse JSON response
            try:
                # Clean up the response to extract JSON
                ai_response = ai_response.strip()
                if ai_response.startswith("```json"):
                    ai_response = ai_response[7:]
                if ai_response.endswith("```"):
                    ai_response = ai_response[:-3]
                
                result = json.loads(ai_response)
                return result
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract command from text
                lines = ai_response.split('\n')
                command = None
                explanation = "AI response could not be parsed as JSON"
                
                for line in lines:
                    if line.strip().startswith('"command"') or line.strip().startswith('command'):
                        # Try to extract command from the line
                        if ':' in line:
                            command_part = line.split(':', 1)[1].strip().strip('"').strip(',')
                            if command_part:
                                command = command_part
                                break
                
                if not command:
                    # Fallback: try to find any command-like text
                    for line in lines:
                        if any(cmd in line.lower() for cmd in ['ls', 'pwd', 'echo', 'cat', 'find', 'grep']):
                            command = line.strip()
                            break
                
                if not command:
                    command = "echo 'Could not parse AI response'"
                
                return {
                    "command": command,
                    "explanation": explanation,
                    "is_safe": True,
                    "warning": "Response format was unexpected, using fallback parsing"
                }
                
        except Exception as e:
            return {
                "command": "echo 'Error generating command'",
                "explanation": f"Error: {str(e)}",
                "is_safe": True,
                "warning": "Failed to generate command"
            }

    def execute_command(self, command: str) -> Dict[str, Any]:
        """Execute a terminal command and return results"""
        try:
            # Handle cd commands specially to update working directory
            if command.strip().startswith('cd '):
                # Extract the directory from cd command
                dir_path = command.strip()[3:].strip()
                
                # Handle special cases
                if dir_path == '~':
                    dir_path = os.path.expanduser('~')
                elif dir_path == '-':
                    # Go back to previous directory (we'd need to track this)
                    dir_path = os.path.expanduser('~')  # Fallback to home
                
                # Try to change directory
                try:
                    os.chdir(dir_path)
                    self.current_working_dir = os.getcwd()
                    return {
                        "success": True,
                        "stdout": f"Changed directory to: {self.current_working_dir}",
                        "stderr": "",
                        "return_code": 0
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "stdout": "",
                        "stderr": f"Failed to change directory: {str(e)}",
                        "return_code": 1
                    }
            
            # Run the command in the current working directory
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                cwd=self.current_working_dir,  # Use tracked working directory
                timeout=30  # 30 second timeout
            )
            
            # Update working directory if it changed (for non-cd commands)
            try:
                new_cwd = os.getcwd()
                if new_cwd != self.current_working_dir:
                    self.current_working_dir = new_cwd
            except:
                pass  # Ignore errors updating working directory
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Command timed out after 30 seconds",
                "return_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Error executing command: {str(e)}",
                "return_code": -1
            }

    def run(self):
        """Main loop for the terminal agent"""
        print("🤖 AI Terminal Agent (with History)")
        print("Type your request in natural language (e.g., 'show me the current directory')")
        print("Type 'quit' or 'exit' to stop")
        print("Type 'history' to see conversation history")
        print("Type 'clear' to clear conversation history\n")
        
        while True:
            try:
                # Get user input
                user_input = input("💬 You: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if user_input.lower() == 'history':
                    self.show_history()
                    continue
                
                if user_input.lower() == 'clear':
                    self.conversation_history.clear()
                    print("🗑️  Conversation history cleared!")
                    continue
                
                if user_input.lower() in ['pwd', 'where am i', 'current directory']:
                    print(f"📍 Current working directory: {self.current_working_dir}")
                    continue
                
                if not user_input:
                    continue
                
                print("🤔 Thinking...")
                
                # Generate command from AI
                ai_response = self.generate_command(user_input)
                
                # Display the generated command
                print(f"\n🔧 Generated command: {ai_response['command']}")
                print(f"📝 Explanation: {ai_response['explanation']}")
                
                if ai_response.get('warning'):
                    print(f"⚠️  Warning: {ai_response['warning']}")
                
                # Safety check
                if not ai_response.get('is_safe', True):
                    print("❌ Command deemed unsafe. Aborting.")
                    continue
                
                # Ask for confirmation
                confirm = input("\n❓ Execute this command? (y/n): ").strip().lower()
                if confirm not in ['y', 'yes']:
                    print("⏭️  Skipped.")
                    continue
                
                # Execute the command
                print("⚡ Executing...")
                result = self.execute_command(ai_response['command'])
                
                # Add to conversation history
                self.add_to_history(user_input, ai_response, result)
                
                # Display results
                print("\n📊 Results:")
                if result['success']:
                    print("✅ Command executed successfully")
                    if result['stdout']:
                        print(f"📤 Output:\n{result['stdout']}")
                else:
                    print("❌ Command failed")
                    if result['stderr']:
                        print(f"📤 Error:\n{result['stderr']}")
                
                print("-" * 50)
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {str(e)}")

    def show_history(self):
        """Display conversation history"""
        if not self.conversation_history:
            print("📝 No conversation history yet.")
            return
        
        print(f"\n📚 Conversation History ({len(self.conversation_history)} exchanges):")
        print("=" * 60)
        
        for i, exchange in enumerate(self.conversation_history, 1):
            print(f"\n🔄 Exchange {i}:")
            print(f"   💬 User: {exchange['user_input']}")
            print(f"   🤖 AI Command: {exchange['ai_response'].get('command', 'N/A')}")
            print(f"   📊 Result: {'✅ Success' if exchange['command_result'].get('success') else '❌ Failed'}")
            if exchange['command_result'].get('stdout'):
                output = exchange['command_result']['stdout'].strip()
                if len(output) > 100:
                    output = output[:100] + "..."
                print(f"   📤 Output: {output}")
            print(f"   ⏰ Time: {exchange['timestamp']}")
            print("-" * 40)

def main():
    """Main function to run the terminal agent"""
    try:
        # Create and run the agent
        agent = TerminalAgent()
        agent.run()
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\nTo fix this:")
        print("1. Install Ollama: https://ollama.ai")
        print("2. Start Ollama: ollama serve")
        print("3. Install Llama 3.2: ollama pull llama3.2")
        sys.exit(1)

if __name__ == "__main__":
    main()
