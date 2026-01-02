import hmac
import json
import time
import hashlib
from pathlib import Path
from typing import Optional

from fastapi import Header, HTTPException, Request, status

from config.settings import settings


async def require_https(request: Request) -> None:
    if request.url.scheme != "https":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HTTPS is required for all API access",
        )


def _load_edge_credentials() -> tuple[Optional[str], Optional[str]]:
    creds_file = Path(settings.DATA_DIR) / "edge_credentials.json"
    if not creds_file.exists():
        return None, None

    try:
        with creds_file.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("edge_key"), data.get("edge_secret")
    except Exception:
        return None, None


async def verify_internal_auth(
    request: Request,
    x_internal_token: Optional[str] = Header(default=None, convert_underscores=False),
) -> None:
    await require_https(request)

    expected_token = settings.CLOUD_API_KEY
    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal authentication is not configured",
        )

    if not x_internal_token or not hmac.compare_digest(str(expected_token), str(x_internal_token)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal authentication token",
        )


async def verify_hmac_signature(
    request: Request,
    x_edge_key: Optional[str] = Header(default=None, convert_underscores=False),
    x_edge_timestamp: Optional[str] = Header(default=None, convert_underscores=False),
    x_edge_signature: Optional[str] = Header(default=None, convert_underscores=False),
) -> None:
    await require_https(request)

    if not x_edge_key or not x_edge_timestamp or not x_edge_signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="HMAC headers are required",
        )

    edge_key, edge_secret = _load_edge_credentials()
    if not edge_key or not edge_secret or edge_key != x_edge_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Edge credentials are invalid or missing",
        )

    try:
        request_time = int(x_edge_timestamp)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp",
        )

    if abs(time.time() - request_time) > 300:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Timestamp out of range",
        )

    body_bytes = await request.body()
    body_hash = hashlib.sha256(body_bytes or b"").hexdigest()
    signature_string = f"{request.method}|{request.url.path}|{x_edge_timestamp}|{body_hash}"
    expected_signature = hmac.new(
        edge_secret.encode("utf-8"), signature_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_edge_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature",
        )
