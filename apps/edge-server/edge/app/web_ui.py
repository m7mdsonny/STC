"""
Web UI
FastAPI routes for Setup, Status, and Errors pages
"""
from fastapi import APIRouter, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from pathlib import Path
from typing import Optional
import json

from .config_store import ConfigStore
from .error_store import ErrorStore
from .status_service import StatusService
from .cloud_client import CloudClient


router = APIRouter()


def get_setup_html() -> str:
    """Setup page HTML"""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edge Server Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 14px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
            margin-top: 10px;
        }
        .btn:hover { background: #5568d3; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .btn-secondary {
            background: #6c757d;
            margin-top: 10px;
        }
        .btn-secondary:hover { background: #5a6268; }
        .alert {
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Edge Server Setup</h1>
        <p class="subtitle">Configure your Edge Server connection to the Cloud</p>
        
        <form id="setupForm" method="POST" action="/setup/save">
            <div class="form-group">
                <label for="cloud_base_url">Cloud Base URL *</label>
                <input type="url" id="cloud_base_url" name="cloud_base_url" 
                       placeholder="https://api.example.com" required>
            </div>
            
            <div class="form-group">
                <label for="edge_key">Edge Key *</label>
                <input type="text" id="edge_key" name="edge_key" 
                       placeholder="edge_xxxxxxxxxxxx" required>
            </div>
            
            <div class="form-group">
                <label for="edge_secret">Edge Secret *</label>
                <input type="password" id="edge_secret" name="edge_secret" 
                       placeholder="Enter your edge secret" required>
            </div>
            
            <button type="button" class="btn btn-secondary" onclick="testConnection()">
                Test Connection
            </button>
            
            <button type="submit" class="btn" id="saveBtn">
                Save & Activate
            </button>
        </form>
        
        <div id="alert"></div>
    </div>
    
    <script>
        async function testConnection() {
            const form = document.getElementById('setupForm');
            const formData = new FormData(form);
            const alertDiv = document.getElementById('alert');
            const saveBtn = document.getElementById('saveBtn');
            
            saveBtn.disabled = true;
            saveBtn.textContent = 'Testing...';
            
            try {
                const response = await fetch('/setup/test', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alertDiv.innerHTML = '<div class="alert alert-success">✓ Connection successful!</div>';
                } else {
                    alertDiv.innerHTML = `<div class="alert alert-error">✗ ${data.error || 'Connection failed'}</div>`;
                }
            } catch (error) {
                alertDiv.innerHTML = `<div class="alert alert-error">✗ Error: ${error.message}</div>`;
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save & Activate';
            }
        }
    </script>
</body>
</html>
"""


def get_status_html(status_data: dict) -> str:
    """Status page HTML"""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edge Server Status</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #333;
            margin-bottom: 30px;
        }}
        .nav {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }}
        .nav a {{
            padding: 10px 20px;
            text-decoration: none;
            color: #667eea;
            border-radius: 6px;
            transition: background 0.3s;
        }}
        .nav a:hover {{
            background: #f0f0f0;
        }}
        .nav a.active {{
            background: #667eea;
            color: white;
        }}
        .status-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }}
        .card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .card h3 {{
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }}
        .stat {{
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }}
        .stat:last-child {{
            border-bottom: none;
        }}
        .stat-label {{
            color: #666;
        }}
        .stat-value {{
            color: #333;
            font-weight: 600;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-online {{ background: #d4edda; color: #155724; }}
        .badge-offline {{ background: #f8d7da; color: #721c24; }}
        .badge-degraded {{ background: #fff3cd; color: #856404; }}
        .badge-setup {{ background: #d1ecf1; color: #0c5460; }}
    </style>
    <script>
        setTimeout(() => location.reload(), 30000); // Auto-refresh every 30s
    </script>
</head>
<body>
    <div class="container">
        <h1>Edge Server Status</h1>
        
        <div class="nav">
            <a href="/status">Status</a>
            <a href="/errors">Errors</a>
            <a href="/setup" class="active">Setup</a>
        </div>
        
        <div class="status-grid">
            <div class="card">
                <h3>Edge State</h3>
                <div class="stat">
                    <span class="stat-label">Status:</span>
                    <span class="stat-value">
                        <span class="badge badge-{status_data.get('edge_state', 'setup').lower().replace(' ', '-')}">
                            {status_data.get('edge_state', 'Unknown')}
                        </span>
                    </span>
                </div>
                <div class="stat">
                    <span class="stat-label">Uptime:</span>
                    <span class="stat-value">{status_data.get('uptime', 'N/A')}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Cloud Connection</h3>
                <div class="stat">
                    <span class="stat-label">Status:</span>
                    <span class="stat-value">{status_data.get('cloud_connectivity', 'Unknown')}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Last Heartbeat:</span>
                    <span class="stat-value">{status_data.get('last_heartbeat', 'Never') or 'Never'}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Cameras</h3>
                <div class="stat">
                    <span class="stat-label">Synced:</span>
                    <span class="stat-value">{status_data.get('cameras_synced_count', 0)}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Events</h3>
                <div class="stat">
                    <span class="stat-label">Sent Today:</span>
                    <span class="stat-value">{status_data.get('events_sent_today', 0)}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>System Resources</h3>
                <div class="stat">
                    <span class="stat-label">CPU:</span>
                    <span class="stat-value">{status_data.get('cpu_usage', 'N/A')}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">RAM:</span>
                    <span class="stat-value">{status_data.get('ram_usage', 'N/A')} ({status_data.get('ram_used_gb', 'N/A')} GB / {status_data.get('ram_total_gb', 'N/A')} GB)</span>
                </div>
            </div>
            
            <div class="card">
                <h3>Last Command</h3>
                <div class="stat">
                    <span class="stat-label">Command:</span>
                    <span class="stat-value">{status_data.get('last_command', {}).get('command', 'None') if status_data.get('last_command') else 'None'}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Received:</span>
                    <span class="stat-value">{status_data.get('last_command', {}).get('received_at', 'Never') if status_data.get('last_command') else 'Never'}</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
"""


def get_errors_html(errors: list) -> str:
    """Errors page HTML"""
    errors_html = ""
    for error in errors:
        errors_html += f"""
        <div class="error-item">
            <div class="error-header">
                <span class="error-time">{error.get('timestamp', 'Unknown')}</span>
                <span class="error-module">{error.get('module', 'unknown')}</span>
            </div>
            <div class="error-message">{error.get('message', 'No message')}</div>
            {f'<div class="error-stack">{error.get("stack_trace", "")}</div>' if error.get('stack_trace') else ''}
        </div>
        """
    
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edge Server Errors</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #333;
            margin-bottom: 30px;
        }}
        .nav {{
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }}
        .nav a {{
            padding: 10px 20px;
            text-decoration: none;
            color: #667eea;
            border-radius: 6px;
            transition: background 0.3s;
        }}
        .nav a:hover {{
            background: #f0f0f0;
        }}
        .nav a.active {{
            background: #667eea;
            color: white;
        }}
        .card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .error-item {{
            padding: 15px;
            border-bottom: 1px solid #eee;
            margin-bottom: 10px;
        }}
        .error-item:last-child {{
            border-bottom: none;
            margin-bottom: 0;
        }}
        .error-header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }}
        .error-time {{
            color: #666;
            font-size: 12px;
        }}
        .error-module {{
            background: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }}
        .error-message {{
            color: #333;
            margin-bottom: 5px;
        }}
        .error-stack {{
            background: #f8f8f8;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            color: #666;
            margin-top: 8px;
            white-space: pre-wrap;
            word-break: break-all;
        }}
        .btn {{
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }}
        .btn:hover {{
            background: #5568d3;
        }}
        .no-errors {{
            text-align: center;
            padding: 40px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Edge Server Errors</h1>
        
        <div class="nav">
            <a href="/status">Status</a>
            <a href="/errors" class="active">Errors</a>
            <a href="/setup">Setup</a>
        </div>
        
        <div class="card">
            {errors_html if errors_html else '<div class="no-errors">No errors recorded</div>'}
        </div>
        
        <a href="/errors/download" class="btn">Download Logs</a>
    </div>
</body>
</html>
"""


@router.get("/setup", response_class=HTMLResponse)
async def setup_page(request: Request):
    """Setup page"""
    from .config_store import ConfigStore
    
    config = ConfigStore()
    
    # If already configured, redirect to status
    if config.is_setup_completed():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/status")
    
    return HTMLResponse(content=get_setup_html())


@router.post("/setup/test")
async def test_connection(
    cloud_base_url: str = Form(...),
    edge_key: str = Form(...),
    edge_secret: str = Form(...)
):
    """Test connection to Cloud"""
    from .error_store import ErrorStore
    from .cloud_client import CloudClient
    
    error_store = ErrorStore()
    client = CloudClient(cloud_base_url, edge_key, edge_secret, error_store)
    
    try:
        await client.connect()
        success, error_msg = await client.test_connection()
        await client.disconnect()
        
        if success:
            return {"success": True}
        else:
            return {"success": False, "error": error_msg or "Connection test failed"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/setup/save")
async def save_setup(
    cloud_base_url: str = Form(...),
    edge_key: str = Form(...),
    edge_secret: str = Form(...)
):
    """Save setup configuration"""
    from fastapi.responses import RedirectResponse
    from .error_store import ErrorStore
    from .cloud_client import CloudClient
    
    config = ConfigStore()
    error_store = ErrorStore()
    
    # Test connection first
    client = CloudClient(cloud_base_url, edge_key, edge_secret, error_store)
    try:
        await client.connect()
        success, error_msg = await client.test_connection()
        await client.disconnect()
        
        if not success:
            return RedirectResponse(
                url=f"/setup?error={error_msg or 'Connection test failed'}",
                status_code=303
            )
    except Exception as e:
        return RedirectResponse(
            url=f"/setup?error={str(e)}",
            status_code=303
        )
    
    # Save configuration
    if config.set_cloud_config(cloud_base_url, edge_key, edge_secret):
        return RedirectResponse(url="/status", status_code=303)
    else:
        return RedirectResponse(
            url="/setup?error=Failed to save configuration",
            status_code=303
        )


@router.get("/status", response_class=HTMLResponse)
async def status_page(request: Request):
    """Status page"""
    # Try to get status service from main module (if running)
    # Otherwise create a new instance
    try:
        # Import main module to access global status_service
        import sys
        from pathlib import Path
        
        # Try to import from main if it's already loaded
        if 'main' in sys.modules:
            main_module = sys.modules['main']
            if hasattr(main_module, 'status_service') and main_module.status_service:
                status_data = main_module.status_service.get_status()
            else:
                from .status_service import StatusService
                status_service = StatusService()
                status_data = status_service.get_status()
        else:
            from .status_service import StatusService
            status_service = StatusService()
            status_data = status_service.get_status()
    except Exception:
        # Fallback if main not initialized
        from .status_service import StatusService
        status_service = StatusService()
        status_data = status_service.get_status()
    
    return HTMLResponse(content=get_status_html(status_data))


@router.get("/errors", response_class=HTMLResponse)
async def errors_page(request: Request):
    """Errors page"""
    from .error_store import ErrorStore
    
    error_store = ErrorStore()
    errors = error_store.get_errors(limit=100)
    
    return HTMLResponse(content=get_errors_html(errors))


@router.get("/errors/download")
async def download_logs():
    """Download error logs"""
    from .error_store import ErrorStore
    
    error_store = ErrorStore()
    logs_file = error_store.errors_file
    
    if logs_file.exists():
        return FileResponse(
            path=str(logs_file),
            filename="errors.log",
            media_type="text/plain"
        )
    else:
        raise HTTPException(status_code=404, detail="No error logs found")
