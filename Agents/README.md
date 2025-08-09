# AI Terminal Agent

A simple AI agent that converts natural language requests into terminal commands using Ollama's Llama 3.2 model.

## Features

- 🤖 Converts natural language to terminal commands
- 🔒 Built-in safety checks to prevent destructive operations
- ⚡ Interactive command-line interface
- 📝 Clear explanations of what each command does
- ✅ Confirmation prompts before execution

## Setup

### 1. Install Ollama

1. Visit [Ollama.ai](https://ollama.ai)
2. Download and install Ollama for your system
3. Start Ollama: `ollama serve`

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Llama 3.2 Model

```bash
ollama pull llama3.2
```

### 4. Run the Agent

```bash
python terminal_agent.py
```

### Alternative: Use Setup Script

For automatic setup, run:

```bash
python setup.py
```

## Usage

Once running, you can type natural language requests like:

- "Show me the current directory"
- "List all files in this folder"
- "Create a new file called test.txt"
- "What's the current date and time?"
- "Show me disk usage"
- "Find all Python files in this directory"

## Safety Features

The agent includes several safety measures:

- ❌ Blocks destructive commands (rm -rf, format, etc.)
- ⚠️ Provides warnings for potentially risky operations
- ✅ Requires confirmation before executing commands
- ⏱️ 30-second timeout on all commands
- 🔍 Validates AI responses before execution

## Example Session

```
🤖 AI Terminal Agent
Type your request in natural language (e.g., 'show me the current directory')
Type 'quit' or 'exit' to stop

💬 You: show me the current directory
🤔 Thinking...

🔧 Generated command: pwd
📝 Explanation: This command shows the current working directory path

❓ Execute this command? (y/n): y
⚡ Executing...

📊 Results:
✅ Command executed successfully
📤 Output:
/Users/username/Desktop/Programming/Cursor Projects/Agents

--------------------------------------------------
```

## Troubleshooting

- **Ollama Not Found**: Install Ollama from https://ollama.ai
- **Ollama Server Not Running**: Run `ollama serve`
- **Model Not Found**: Run `ollama pull llama3.2`
- **Import Error**: Run `pip install -r requirements.txt`
- **Permission Error**: Some commands may require elevated permissions
- **Connection Error**: Make sure Ollama is running on localhost:11434

## Security Note

This agent runs commands on your local system. Always review the generated commands before execution, especially when dealing with file operations or system commands.
