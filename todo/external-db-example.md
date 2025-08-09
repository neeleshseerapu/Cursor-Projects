# External JSON Database Examples

This document shows how to connect your UCLA Todo app to various external JSON database services.

## Quick Setup

### 1. JSONBin.io (Free Tier)

**Step 1: Create a JSONBin account**

- Go to [jsonbin.io](https://jsonbin.io)
- Sign up for a free account
- Create a new bin

**Step 2: Configure environment variables**

```bash
# Get your API key from JSONBin dashboard
export EXTERNAL_DB_API_KEY="your-jsonbin-api-key"

# Use JSONBin API URL (replace with your bin ID)
export EXTERNAL_DB_URL="https://api.jsonbin.io/v3/b/your-bin-id"

# Start the server
npm start
```

**Step 3: Test the connection**

```bash
curl -H "X-Master-Key: $EXTERNAL_DB_API_KEY" \
     https://api.jsonbin.io/v3/b/your-bin-id
```

### 2. JSON Server (Self-hosted)

**Step 1: Install JSON Server**

```bash
npm install -g json-server
```

**Step 2: Create a db.json file**

```json
{
  "users": {
    "bruin": {
      "todos": []
    }
  }
}
```

**Step 3: Start JSON Server**

```bash
json-server --watch db.json --port 3002
```

**Step 4: Configure your app**

```bash
export EXTERNAL_DB_URL="http://localhost:3002"
npm start
```

### 3. Supabase (PostgreSQL with JSON support)

**Step 1: Create Supabase project**

- Go to [supabase.com](https://supabase.com)
- Create a new project
- Get your API key and URL

**Step 2: Create the todos table**

```sql
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  todos JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_todos_username ON todos(username);
```

**Step 3: Configure environment variables**

```bash
export EXTERNAL_DB_URL="https://your-project.supabase.co/rest/v1"
export EXTERNAL_DB_API_KEY="your-supabase-anon-key"
npm start
```

## API Endpoint Examples

### JSONBin.io Response Format

```json
{
  "record": {
    "users": {
      "bruin": {
        "todos": [
          {
            "id": 1234567890,
            "text": "Study for finals",
            "priority": "high",
            "completed": false,
            "createdAt": "2024-01-15T10:30:00.000Z"
          }
        ]
      }
    }
  }
}
```

### JSON Server Response Format

```json
{
  "users": {
    "bruin": {
      "todos": [
        {
          "id": 1234567890,
          "text": "Study for finals",
          "priority": "high",
          "completed": false,
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

## Testing External Database Connection

### 1. Check if external DB is configured

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{
  "ok": true,
  "external_db": "https://your-external-db.com"
}
```

### 2. Test user data retrieval

```bash
curl http://localhost:3001/api/users/bruin/todos
```

### 3. Test user data storage

```bash
curl -X PUT http://localhost:3001/api/users/bruin/todos \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": 1234567890,
      "text": "Test todo",
      "priority": "medium",
      "completed": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]'
```

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Ensure your external database allows CORS requests
   - Check if the API key is correct

2. **Authentication Errors**

   - Verify the API key format
   - Check if the key has the correct permissions

3. **Network Errors**

   - Test the external database URL directly
   - Check if the service is available

4. **Data Format Issues**
   - Ensure the external database returns the expected JSON format
   - Check if the todos array is properly structured

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
export DEBUG=true
npm start
```

This will show detailed logs about external database connections and any errors.

## Migration from Local to External

### 1. Backup local data

```bash
# Copy local data files
cp -r data/ data-backup/
```

### 2. Configure external database

```bash
export EXTERNAL_DB_URL="your-external-db-url"
export EXTERNAL_DB_API_KEY="your-api-key"
```

### 3. Start the server

```bash
npm start
```

### 4. Verify migration

- Check that todos are loading from external database
- Verify that new todos are being saved to external database
- Test with different users

## Security Considerations

1. **API Keys**: Store API keys in environment variables, not in code
2. **HTTPS**: Use HTTPS for external database connections
3. **Rate Limiting**: Be aware of rate limits on external services
4. **Data Validation**: Validate data before sending to external database
5. **Backup Strategy**: Keep local backups as fallback

## Performance Tips

1. **Caching**: The app caches data locally for better performance
2. **Batch Operations**: Consider batching multiple todo updates
3. **Connection Pooling**: Use connection pooling for high-traffic applications
4. **CDN**: Use CDN for static assets if deploying to production
