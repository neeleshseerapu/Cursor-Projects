# UCLA Student Todo App 🐻

A modern, responsive todo application specifically designed for UCLA students with official UCLA branding and colors.

## Features

### 🎨 UCLA Themed Design

- Official UCLA blue (#2774AE) and gold (#FFD100) color scheme
- UCLA Bruins branding and logo elements
- Modern, clean interface with smooth animations
- Responsive design for all devices

### ✨ Core Functionality

- **Add Tasks**: Create new todos with priority levels (Low, Medium, High)
- **Mark Complete**: Check off completed tasks with visual feedback
- **Edit Tasks**: Modify existing tasks inline
- **Delete Tasks**: Remove unwanted tasks
- **Filter Tasks**: View All, Active, or Completed tasks
- **Sort Tasks**: Sort by Date, Priority, or Alphabetically
- **Statistics**: Real-time tracking of total, completed, and pending tasks

### 🚀 Advanced Features

- **Local Storage**: Tasks persist between browser sessions
- **External JSON Database Support**: Connect to external JSON databases
- **Multi-User Support**: Switch between different users
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Enter`: Add new task
  - `Escape`: Clear input field
- **Notifications**: Success, warning, and info notifications
- **Sample Data**: Welcome tasks for first-time users
- **Export/Import**: Backup and restore your todos
- **Mobile Responsive**: Works perfectly on phones and tablets

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for server features)
- No additional software required for basic usage

### Installation

1. Clone or download this repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Open `http://localhost:3001` in your web browser

### Usage

#### Adding Tasks

1. Type your task in the input field
2. Select a priority level (Low, Medium, High)
3. Click the "+" button or press `Ctrl/Cmd + Enter`

#### Managing Tasks

- **Complete**: Click the checkbox next to a task
- **Edit**: Click the edit icon (pencil) to modify a task
- **Delete**: Click the trash icon to remove a task

#### Filtering and Sorting

- **Filter**: Use the filter buttons (All, Active, Completed) to view specific tasks
- **Sort**: Use the dropdown to sort by Date, Priority, or Alphabetically

#### User Management

- **Switch Users**: Enter a username and click "Switch" to change users
- **User-Specific Data**: Each user has their own todo list

## External JSON Database Support

The app supports connecting to external JSON databases for enhanced data persistence and sharing.

### Configuration

Set these environment variables to connect to an external JSON database:

```bash
# External JSON database URL
EXTERNAL_DB_URL=https://your-json-db-api.com

# API key for authentication (if required)
EXTERNAL_DB_API_KEY=your-api-key-here
```

### Supported External JSON Databases

The app is compatible with any JSON database that supports these REST endpoints:

#### Required API Endpoints

1. **GET** `/users/{username}/todos`

   - Returns: Array of todo objects
   - Headers: `Authorization: Bearer {api-key}` (optional)

2. **PUT** `/users/{username}/todos`
   - Body: Array of todo objects
   - Headers: `Authorization: Bearer {api-key}` (optional)
   - Returns: `{ "ok": true, "count": number }`

#### Example External Database Services

- **JSONBin.io**: `https://api.jsonbin.io/v3/b/{bin-id}`
- **JSON Server**: `https://your-json-server.herokuapp.com`
- **Supabase**: `https://your-project.supabase.co/rest/v1`
- **Firebase**: `https://your-project.firebaseio.com`
- **Custom API**: Any REST API that follows the above pattern

### Fallback Behavior

- **Primary**: External JSON database (if configured)
- **Fallback**: Local JSON files in `data/` directory
- **Offline**: Browser localStorage

### Example Configuration

```bash
# For JSONBin.io
EXTERNAL_DB_URL=https://api.jsonbin.io/v3/b/your-bin-id
EXTERNAL_DB_API_KEY=your-jsonbin-api-key

# For custom API
EXTERNAL_DB_URL=https://your-api.com/api
EXTERNAL_DB_API_KEY=your-api-key

# Start the server
npm start
```

## File Structure

```
todo/
├── public/              # Frontend files
│   ├── index.html       # Main HTML file
│   ├── styles.css       # UCLA-themed CSS styles
│   ├── script.js        # JavaScript functionality
│   └── manifest.json    # PWA manifest
├── data/                # Local JSON storage
│   ├── bruin.json       # User data files
│   └── ...
├── server.js            # Express server
├── package.json         # Dependencies
└── README.md           # This documentation
```

## UCLA Branding

This app uses the official UCLA colors:

- **UCLA Blue**: #2774AE (Primary brand color)
- **UCLA Gold**: #FFD100 (Secondary brand color)
- **UCLA Dark Blue**: #005587 (Darker shade for hover states)
- **UCLA Light Blue**: #8BB8E8 (Light accent color)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Data Storage

The app uses a multi-tier storage approach:

1. **External JSON Database** (if configured): Primary storage for multi-user data
2. **Local JSON Files**: Fallback storage in `data/` directory
3. **Browser localStorage**: Offline/fallback storage for individual users

### Data Persistence

- **Multi-user support**: Each user has their own data file
- **Cross-device sync**: When using external JSON database
- **Offline capability**: Works without internet connection
- **Data backup**: Export/import functionality

## Contributing

Feel free to contribute to this project! Some ideas for improvements:

- Add due dates for tasks
- Implement task categories/tags
- Add dark mode toggle
- Create task templates for common student activities
- Add calendar integration
- Implement task sharing between users
- Add real-time collaboration features

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- UCLA for the official brand colors and identity
- Font Awesome for the icons
- Google Fonts for the Inter font family
- The UCLA Bruins community for inspiration

---

**Go Bruins! 🐻💙💛**

_Built with ❤️ for UCLA students_
