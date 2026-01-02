# STC Edge Server - Windows Installation

Professional Edge Server for Windows with one-click installation.

## Quick Start

1. **Double-click `install.bat`**
   - Checks Windows version and admin privileges
   - Installs Python dependencies
   - Registers as Windows service
   - Starts Edge Server automatically

2. **Open browser to `http://localhost:8090`**
   - Setup page appears on first run
   - Enter Cloud Base URL, Edge Key, and Edge Secret
   - Test connection and save

3. **Edge Server is now operational**
   - Status page shows real-time metrics
   - Errors page shows any issues
   - Heartbeat runs every 30 seconds
   - Commands (restart, sync-config) work in real-time

## File Structure

```
edge/
├── install.bat          # Installation script
├── start.bat            # Start Edge Server
├── stop.bat             # Stop Edge Server
├── update.bat           # Update Edge Server
├── uninstall.bat        # Uninstall Edge Server
│
├── venv/                # Python virtual environment (created by install.bat)
│
├── app/
│   ├── main.py          # FastAPI application entry point
│   ├── web_ui.py        # Setup/Status/Errors pages
│   ├── config_store.py  # Configuration management
│   ├── cloud_client.py  # Cloud API client with HMAC
│   ├── signer.py        # HMAC signature generation
│   ├── heartbeat.py     # Heartbeat service
│   ├── camera_sync.py   # Camera synchronization
│   ├── event_sender.py  # Event sending service
│   ├── command_listener.py  # Command execution
│   ├── status_service.py    # Status tracking
│   └── error_store.py       # Error logging
│
├── logs/
│   ├── edge.log         # General logs
│   └── errors.log       # Error logs
│
├── data/
│   └── edge.db          # SQLite local cache
│
└── config/
    └── config.json      # Configuration file
```

## Features

### ✅ Real Actions (No Fake Features)
- **Heartbeat**: Real HMAC-signed requests every 30 seconds
- **Camera Sync**: Real synchronization from Cloud
- **Event Sending**: Real-time event transmission
- **Restart Command**: Actually restarts the service
- **Sync Config Command**: Actually syncs cameras from Cloud

### ✅ Security
- **HMAC Authentication**: All Cloud requests are signed
- **No Secrets in Logs**: Secrets are never logged
- **Timestamp Validation**: Replay attack protection

### ✅ Error Handling
- **No Silent Failures**: All errors are logged and visible
- **Error Store**: Last 100 errors available in UI
- **Log Download**: Download error logs for debugging

### ✅ Windows Service
- **Scheduled Task**: Runs automatically on system startup
- **No EXE Required**: Pure Python implementation
- **Easy Management**: Use start.bat / stop.bat

## Commands

### Installation
```batch
install.bat
```
- Checks prerequisites
- Creates virtual environment
- Installs dependencies
- Registers Windows service
- Starts Edge Server

### Start
```batch
start.bat
```
- Starts Edge Server
- Opens browser automatically

### Stop
```batch
stop.bat
```
- Stops Edge Server
- Stops scheduled task

### Update
```batch
update.bat
```
- Stops Edge Server
- Updates dependencies
- Preserves configuration
- Restarts Edge Server

### Uninstall
```batch
uninstall.bat
```
- Stops Edge Server
- Removes scheduled task
- Optionally archives logs
- Removes virtual environment

## Web UI Pages

### Setup Page (`/setup`)
- **First run only** (redirects to status if already configured)
- Fields: Cloud Base URL, Edge Key, Edge Secret
- Test Connection button (real HMAC-signed request)
- Save & Activate button

### Status Page (`/status`)
- Edge State: Setup Required / Online / Offline / Degraded
- Last heartbeat time
- Cloud connectivity status
- Cameras synced count
- Events sent today
- CPU / RAM usage
- Last received command
- Auto-refreshes every 30 seconds

### Errors Page (`/errors`)
- Last 100 errors
- Timestamp, module, message, stack trace
- Download logs button

## Cloud Communication

All requests to Cloud use HMAC authentication:

```
Headers:
  X-EDGE-KEY: edge_key
  X-EDGE-TIMESTAMP: unix_timestamp
  X-EDGE-SIGNATURE: hmac_sha256(edge_secret, method|path|timestamp|body_hash)
```

### Endpoints Used
- `POST /api/v1/edges/heartbeat` - Heartbeat
- `GET /api/v1/edges/cameras` - Get cameras
- `POST /api/v1/edges/events` - Send events
- `POST /api/v1/system/restart` - Restart command (received)
- `POST /api/v1/system/sync-config` - Sync config command (received)

## Troubleshooting

### Port 8090 Already in Use
- Run `stop.bat` first
- Or change port in `config/config.json`

### Python Not Found
- Install Python 3.10+ from python.org
- Ensure Python is in PATH
- Run `install.bat` again

### Service Not Starting
- Check `logs/edge.log` for errors
- Verify configuration in `config/config.json`
- Ensure Cloud API is accessible

### Connection Test Fails
- Verify Cloud Base URL is correct
- Check Edge Key and Edge Secret
- Ensure Cloud API is running
- Check firewall settings

## Development

### Running Manually
```batch
venv\Scripts\activate
python app\main.py
```

### Testing
- Visit `http://localhost:8090/setup` for setup
- Visit `http://localhost:8090/status` for status
- Visit `http://localhost:8090/errors` for errors

## Notes

- **No EXE files**: Pure Python implementation
- **No manual steps**: install.bat handles everything
- **No fake features**: All actions are real
- **No silent failures**: All errors are logged and visible
- **Easy updates**: Just run update.bat

## Support

For issues or questions:
1. Check `logs/edge.log` for detailed logs
2. Check `logs/errors.log` for errors
3. Visit Errors page in web UI
4. Review configuration in `config/config.json`
