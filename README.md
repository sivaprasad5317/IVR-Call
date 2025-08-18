# Azure Communication Services SoftPhone Demo

## Quick Setup for Demo

### 1. Azure Communication Services Setup

1. **Create ACS Resource:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Create a new "Communication Services" resource
   - Note down the connection string from Keys section

2. **Generate User Tokens:**
   ```bash
   # Using Azure CLI (install if not present)
   az extension add --name communication
   
   # Create users and get tokens
   az communication identity user create --connection-string "YOUR_CONNECTION_STRING"
   az communication identity token issue --connection-string "YOUR_CONNECTION_STRING" --scope voip --user-id "USER_ID_FROM_PREVIOUS_COMMAND"
   ```

### 2. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your actual values:
   - Replace `REACT_APP_ACS_CONNECTION_STRING` with your connection string
   - Replace `REACT_APP_ACS_TOKEN` with generated token
   - Replace `REACT_APP_ACS_USER_ID` with your user ID

### 3. Demo Users for Testing

For demo purposes, create at least 2 users:
- **User A:** Primary demo user (your token in .env)
- **User B:** Target user to call (set in REACT_APP_DEMO_TARGET_USER_ID)

### 4. Run the Demo

```bash
npm install
npm start
```

### 5. Testing the App

1. **Single User Test:**
   - Start the app
   - Use the demo target user ID to initiate calls
   
2. **Two User Test:**
   - Open two browser windows/tabs
   - Use different tokens for each window
   - Make calls between the users

### 6. Demo Scenarios

- **Voice Call:** Enter target user ID and click "Start Call"
- **Video Call:** Start call and click "Toggle Video"
- **Incoming Call:** Have another user call you

### Troubleshooting

- Ensure browser has microphone/camera permissions
- Check browser console for errors
- Verify tokens are valid and not expired
- Ensure both users have valid ACS identities

### Demo Data (Replace with Real Values)

The .env.example contains placeholder values. Replace them with:
- Real ACS connection string from Azure Portal
- Valid user tokens (expire after 24 hours by default)
- Actual user IDs from your ACS resource
# IVR-Call
