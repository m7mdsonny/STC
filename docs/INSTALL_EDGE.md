# Edge Server Installation Guide

**Last Updated**: 2025-01-30  
**Version**: 1.0

---

## Overview

This guide covers the installation and setup of the Edge Server (Python) for the STC AI-VAP Platform.

The Edge Server runs locally at customer sites and processes video streams using AI models.

---

## Requirements

### Operating System
- **Windows**: Windows 10/11 (64-bit)
- **Linux**: Ubuntu 20.04+ / Debian 11+ (for future support)

### Software Requirements
- **Python**: 3.10 or higher
- **pip**: 23.0+ (Python package manager)
- **FFmpeg**: Latest version (for video processing)
- **OpenCV**: Included in requirements.txt

### Hardware Requirements (Recommended)
- **CPU**: 4+ cores (Intel i5 or equivalent)
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GPU with CUDA support (optional, for faster processing)
- **Storage**: 50GB+ free space
- **Network**: Stable internet connection for Cloud communication

---

## Installation Steps

### Windows Installation

#### 1. Install Python

Download and install Python 3.10+ from [python.org](https://www.python.org/downloads/)

**Important**: Check "Add Python to PATH" during installation.

Verify installation:
```bash
python --version  # Should be 3.10+
pip --version
```

#### 2. Install FFmpeg

Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use:
```bash
# Using Chocolatey (if installed)
choco install ffmpeg

# Or download and add to PATH manually
```

Verify installation:
```bash
ffmpeg -version
```

#### 3. Navigate to Edge Server Directory

```bash
cd apps/edge-server/edge
```

#### 4. Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

### Linux Installation

#### 1. Install Python and pip

```bash
sudo apt update
sudo apt install python3.10 python3-pip python3-venv
```

#### 2. Install FFmpeg

```bash
sudo apt install ffmpeg
```

#### 3. Navigate to Edge Server Directory

```bash
cd apps/edge-server/edge
```

#### 4. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## Configuration

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Edge Server

Create `config/config.json`:

```json
{
  "cloud_base_url": "https://api.your-domain.com/api",
  "edge_key": "",
  "edge_secret": "",
  "setup_completed": false
}
```

**Initial Setup**:
- `edge_key` and `edge_secret` are obtained from Cloud dashboard when creating Edge Server
- `setup_completed` should be `false` for first run

### 3. Run Setup

#### Windows

```bash
# Double-click install.bat
# Or run from command line:
install.bat
```

#### Linux

```bash
chmod +x install.sh
./install.sh
```

The setup will:
- Check system requirements
- Create virtual environment
- Install dependencies
- Register as system service
- Open browser to setup page

---

## First-Time Setup

### 1. Access Setup Page

After installation, browser should open automatically to:
```
http://localhost:8090/setup
```

If not, open manually in browser.

### 2. Enter Cloud Connection Details

- **Cloud Base URL**: `https://api.your-domain.com/api`
- **Edge Key**: From Cloud dashboard (Edge Server creation)
- **Edge Secret**: From Cloud dashboard (Edge Server creation)

### 3. Test Connection

Click "Test Connection" to verify:
- Network connectivity
- HMAC authentication
- Cloud API accessibility

### 4. Save & Activate

Click "Save & Activate" to:
- Save configuration
- Start Edge Server services
- Begin heartbeat to Cloud

---

## Running the Edge Server

### Windows Service

The Edge Server runs as a Windows Scheduled Task (background service).

**Start**:
```bash
start.bat
```

**Stop**:
```bash
stop.bat
```

**Status**: Check `http://localhost:8090/status`

### Manual Run (Development)

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux

# Run Edge Server
python app/main.py
```

---

## Local Web UI

The Edge Server provides a local web interface at `http://localhost:8090`

### Pages

1. **Setup** (`/setup`): First-time configuration
2. **Status** (`/status`): Current Edge Server status
3. **Errors** (`/errors`): Error logs and diagnostics

### Status Page Shows

- Edge State (Operational/Degraded/Offline)
- Last heartbeat time
- Cloud connectivity status
- Cameras synced count
- Events sent today
- CPU/RAM usage
- Last received command

---

## Common Commands

### Windows

```bash
# Install
install.bat

# Start service
start.bat

# Stop service
stop.bat

# Update Edge Server
update.bat

# Uninstall
uninstall.bat
```

### Linux

```bash
# Install
./install.sh

# Start service
sudo systemctl start stc-edge

# Stop service
sudo systemctl stop stc-edge

# Check status
sudo systemctl status stc-edge

# View logs
sudo journalctl -u stc-edge -f
```

---

## Configuration Files

### `config/config.json`

Main configuration file:

```json
{
  "cloud_base_url": "https://api.your-domain.com/api",
  "edge_key": "edge_xxxxxxxxxxxx",
  "edge_secret": "xxxxxxxxxxxx",
  "setup_completed": true,
  "port": 8090,
  "log_level": "INFO"
}
```

### `data/edge.db`

SQLite database for local cache:
- Camera configurations
- Event queue
- Local state

**Location**: `apps/edge-server/edge/data/edge.db`

---

## Logs

### Log Files

- `logs/edge.log`: General application logs
- `logs/errors.log`: Error logs only
- `logs/heartbeat.log`: Heartbeat communication logs
- `logs/commands.log`: Command execution logs

### View Logs

**Windows**:
```bash
# View latest logs
type logs\edge.log
type logs\errors.log
```

**Linux**:
```bash
# View latest logs
tail -f logs/edge.log
tail -f logs/errors.log
```

---

## Common Errors & Fixes

### Error: "Python not found"

**Cause**: Python not in PATH

**Fix**:
1. Reinstall Python with "Add to PATH" checked
2. Or add Python manually to PATH
3. Restart terminal/command prompt

### Error: "FFmpeg not found"

**Cause**: FFmpeg not installed or not in PATH

**Fix**:
1. Install FFmpeg
2. Add FFmpeg to system PATH
3. Restart terminal

### Error: "Failed to connect to Cloud"

**Cause**: Network or authentication issue

**Fix**:
1. Verify `cloud_base_url` in `config.json`
2. Check internet connectivity
3. Verify `edge_key` and `edge_secret` are correct
4. Check Cloud API is accessible: `curl https://api.your-domain.com/api/up`

### Error: "HMAC signature verification failed"

**Cause**: Incorrect `edge_secret` or clock skew

**Fix**:
1. Verify `edge_secret` matches Cloud dashboard
2. Sync system clock: `w32tm /resync` (Windows)
3. Check timezone settings

### Error: "Port 8090 already in use"

**Cause**: Another process using port 8090

**Fix**:
```bash
# Windows: Find process
netstat -ano | findstr :8090

# Kill process or change port in config.json
```

---

## Verification

### 1. Check Edge Server Status

Open browser: `http://localhost:8090/status`

Should show:
- State: "Operational"
- Cloud connectivity: "Connected"
- Last heartbeat: Recent timestamp

### 2. Check Cloud Dashboard

In Cloud dashboard:
- Edge Server should appear as "Online"
- Last heartbeat should be recent
- Cameras should sync automatically

### 3. Test Camera Sync

1. Add camera in Cloud dashboard
2. Assign to this Edge Server
3. Check Edge Server status page - camera count should increase
4. Check `logs/camera_sync.log` for sync activity

---

## Security

### HMAC Authentication

All Edge Server communication uses HMAC-SHA256:
- Every request signed with `edge_secret`
- Timestamp validation (5-minute window)
- Replay attack protection

### Local Network Isolation

- Edge Server runs on local network
- Only outbound connections to Cloud
- No inbound connections from internet
- Video data stays local

---

## Next Steps

1. **Add Cameras**: Use Cloud dashboard to add cameras
2. **Configure AI Modules**: Enable desired AI modules per camera
3. **Monitor Status**: Check Edge Server status page regularly
4. **Review Logs**: Monitor logs for errors or warnings

---

## Support

For issues or questions:
- Check `logs/errors.log` for error details
- Review Edge Server status page
- Check Cloud dashboard for Edge Server status
- Contact: support@stcsolutions.net

---

**Last Updated**: 2025-01-30
