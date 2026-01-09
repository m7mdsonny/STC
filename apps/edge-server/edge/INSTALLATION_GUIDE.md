# Edge Server Installation Guide

## Prerequisites

- Windows 10 or 11
- Administrator privileges
- Python 3.10 or later (will be checked during installation)
- Internet connection (for downloading dependencies)

## Installation Steps

### Step 1: Download Edge Server

Extract the Edge Server files to a directory, for example:
```
C:\STC\EdgeServer\
```

### Step 2: Run Installation

1. **Right-click on `install.bat`**
2. **Select "Run as administrator"**
3. The installation script will:
   - Check Windows version
   - Verify admin privileges
   - Check Python installation
   - Check port 8090 availability
   - Create virtual environment
   - Install dependencies
   - Register Windows service
   - Start Edge Server

### Step 3: Configure Edge Server

1. **Browser will open automatically** to `http://localhost:8090`
2. If setup page appears:
   - Enter **Cloud Base URL** (e.g., `https://api.example.com`)
   - Enter **Edge Key** (provided when creating Edge Server in Cloud)
   - Enter **Edge Secret** (provided when creating Edge Server in Cloud)
   - Click **"Test Connection"** to verify
   - Click **"Save & Activate"** to complete setup

3. **Edge Server is now operational!**

## Verification

### Check Status Page
- Visit `http://localhost:8090/status`
- Verify Edge State is "Online"
- Check Cloud connectivity is "Connected"
- Verify Last Heartbeat shows recent timestamp

### Check Errors Page
- Visit `http://localhost:8090/errors`
- Should show "No errors recorded" if everything is working

## Troubleshooting

### Installation Fails

**Problem**: "Python not found"
- **Solution**: Install Python 3.10+ from python.org
- Ensure "Add Python to PATH" is checked during installation
- Run `install.bat` again

**Problem**: "Port 8090 already in use"
- **Solution**: 
  - Run `stop.bat` to stop existing Edge Server
  - Or change port in `config/config.json` after installation

**Problem**: "Failed to register scheduled task"
- **Solution**: 
  - Ensure running as Administrator
  - Check Windows Task Scheduler permissions

### Connection Test Fails

**Problem**: "Connection test failed"
- **Solution**:
  - Verify Cloud Base URL is correct (no trailing slash)
  - Check Edge Key and Edge Secret are correct
  - Ensure Cloud API is accessible from this machine
  - Check firewall settings
  - Verify Cloud API is running

### Edge Server Not Starting

**Problem**: Service not starting automatically
- **Solution**:
  - Check `logs/edge.log` for errors
  - Verify configuration in `config/config.json`
  - Run `start.bat` manually
  - Check Windows Event Viewer for errors

### Heartbeat Not Working

**Problem**: Last Heartbeat shows "Never"
- **Solution**:
  - Check `logs/errors.log` for authentication errors
  - Verify Edge Key and Edge Secret in `config/config.json`
  - Ensure Cloud API endpoint `/api/v1/edges/heartbeat` is accessible
  - Check network connectivity

## Manual Operations

### Start Edge Server
```batch
start.bat
```

### Stop Edge Server
```batch
stop.bat
```

### Update Edge Server
```batch
update.bat
```

### Uninstall Edge Server
```batch
uninstall.bat
```

## File Locations

- **Configuration**: `config/config.json`
- **Logs**: `logs/edge.log`, `logs/errors.log`
- **Data**: `data/edge.db` (SQLite cache)
- **Virtual Environment**: `venv/`

## Security Notes

- **Edge Secret** is stored in `config/config.json` (plain text)
- Protect `config/config.json` file (Windows file permissions)
- Never share `config/config.json` file
- Edge Secret is only sent in HMAC signatures (never in logs)

## Support

For issues:
1. Check `logs/edge.log` for detailed logs
2. Check `logs/errors.log` for errors
3. Visit Errors page in web UI
4. Review configuration in `config/config.json`
