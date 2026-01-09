import os
from typing import Optional

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

from config.settings import settings

router = APIRouter(tags=["Setup"])


class SetupConfig(BaseModel):
    cloud_api_url: str
    cloud_api_key: Optional[str] = None
    license_key: str


SETUP_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>STC AI-VAP Edge Server Setup</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            width: 100%;
            max-width: 500px;
            padding: 40px;
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #1a1a2e;
            font-size: 24px;
            font-weight: 700;
        }
        .logo p {
            color: #6b7280;
            font-size: 14px;
            margin-top: 5px;
        }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 14px;
        }
        .status.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status.warning {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
        }
        .status.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 14px;
        }
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        button:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
        }
        .help {
            margin-top: 8px;
            font-size: 12px;
            color: #9ca3af;
        }
        .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>STC AI-VAP</h1>
            <p>Edge Server Configuration</p>
        </div>

        {status_html}

        <form method="POST" action="/setup/save">
            <div class="form-group">
                <label>Cloud API URL</label>
                <input type="url" name="cloud_api_url" value="{cloud_api_url}"
                       placeholder="https://your-cloud-server" required>
                <p class="help">Base URL for the STC cloud FastAPI server</p>
            </div>

            <div class="form-group">
                <label>Cloud API Key (optional)</label>
                <input type="text" name="cloud_api_key" value="{cloud_api_key}"
                       placeholder="Bearer token if required">
                <p class="help">If the cloud server requires a bearer token, paste it here</p>
            </div>

            <div class="form-group">
                <label>License Key</label>
                <input type="text" name="license_key" value="{license_key}"
                       placeholder="XXXX-XXXX-XXXX-XXXX" required>
                <p class="help">Your STC AI-VAP license key</p>
            </div>

            <button type="submit">Save & Connect</button>
        </form>

        <div class="footer">
            STC AI-VAP Edge Server v{version}
        </div>
    </div>
</body>
</html>
"""


@router.get("/setup", response_class=HTMLResponse)
async def setup_page(request: Request, status: Optional[str] = None, msg: Optional[str] = None):
    status_html = ""

    if status == "success":
        status_html = f'<div class="status success">{msg or "Configuration saved successfully!"}</div>'
    elif status == "error":
        status_html = f'<div class="status error">{msg or "Configuration failed. Please check your settings."}</div>'
    elif not settings.is_configured():
        status_html = '<div class="status warning">Please configure your connection settings to get started.</div>'

    html = SETUP_HTML.format(
        status_html=status_html,
        cloud_api_url=settings.CLOUD_API_URL or "",
        cloud_api_key=settings.CLOUD_API_KEY or "",
        license_key=settings.LICENSE_KEY or "",
        version=settings.APP_VERSION
    )

    return HTMLResponse(content=html)


@router.post("/setup/save")
async def save_setup(
    cloud_api_url: str = Form(...),
    cloud_api_key: Optional[str] = Form(None),
    license_key: str = Form(...)
):
    from app.core.database import CloudDatabase

    db = CloudDatabase()
    db._headers = {"Content-Type": "application/json"}
    if cloud_api_key:
        db._headers["Authorization"] = f"Bearer {cloud_api_key}"

    try:
        import httpx
        async with httpx.AsyncClient(base_url=cloud_api_url, headers=db._headers, timeout=10.0) as client:
            response = await client.get("/")
            if response.status_code not in (200, 404):
                return RedirectResponse(
                    url="/setup?status=error&msg=Could not connect to cloud API",
                    status_code=303
                )
    except Exception as e:
        return RedirectResponse(
            url=f"/setup?status=error&msg=Connection error: {str(e)[:50]}",
            status_code=303
        )

    env_content = f"""# STC AI-VAP Edge Server Configuration
# Generated automatically - do not edit manually

CLOUD_API_URL={cloud_api_url}
CLOUD_API_KEY={cloud_api_key or ''}
LICENSE_KEY={license_key}

# Server Settings
SERVER_HOST=0.0.0.0
SERVER_PORT=8080
DEBUG=false

# Logging
LOG_LEVEL=INFO
LOG_DIR=logs

# Performance
MAX_CAMERAS=16
PROCESSING_FPS=5
SYNC_INTERVAL=30
"""

    try:
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(env_content)
    except Exception as e:
        return RedirectResponse(
            url=f"/setup?status=error&msg=Could not save configuration: {str(e)[:50]}",
            status_code=303
        )

    return RedirectResponse(
        url="/setup?status=success&msg=Configuration saved! Please restart the server.",
        status_code=303
    )


@router.get("/setup/test")
async def test_connection():
    from app.core.database import CloudDatabase

    if not settings.is_configured():
        return {"success": False, "message": "Not configured"}

    db = CloudDatabase()
    connected = await db.connect()

    if not connected:
        return {"success": False, "message": "Connection failed"}

    if settings.has_license():
        valid, license_data = await db.validate_license(settings.LICENSE_KEY)
        await db.disconnect()

        if valid:
            return {
                "success": True,
                "message": "Connected and licensed",
                "license": {
                    "plan": license_data.get('plan'),
                    "max_cameras": license_data.get('max_cameras'),
                    "modules": license_data.get('modules')
                }
            }
        else:
            return {"success": False, "message": "Invalid license key"}

    await db.disconnect()
    return {"success": True, "message": "Connected but no license"}
