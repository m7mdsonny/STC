# -*- mode: python ; coding: utf-8 -*-
"""
STC AI-VAP Edge Server - PyInstaller Spec File
Professional Windows executable build configuration
"""

import os
import sys

block_cipher = None
SPEC_DIR = os.path.dirname(os.path.abspath(SPEC))

hiddenimports = [
    'uvicorn',
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.lifespan',
    'uvicorn.lifespan.on',
    'fastapi',
    'starlette',
    'pydantic',
    'pydantic_settings',

    'win32serviceutil',
    'win32service',
    'win32event',
    'servicemanager',
    'win32timezone',

    'cv2',
    'numpy',
    'PIL',
    'PIL.Image',

    'httpx',

    'app',
    'app.api',
    'app.api.routes',
    'app.api.setup',
    'app.core',
    'app.core.database',
    'app.core.license',
    'app.core.pairing',
    'app.services',
    'app.services.sync',
    'app.services.camera',
    'app.service',
    'app.service.windows',
    'app.ai',
    'app.ai.base',
    'app.ai.manager',
    'app.ai.modules',
    'app.ai.modules.face_recognition',
    'app.ai.modules.people_counter',
    'app.ai.modules.fire_detection',
    'app.ai.modules.intrusion_detection',
    'app.ai.modules.vehicle_recognition',
    'app.ai.modules.attendance',
    'app.ai.modules.loitering',
    'app.ai.modules.crowd_detection',
    'app.ai.modules.object_detection',
    'config',
    'config.settings',
    'loguru',
]

datas = [
    (os.path.join(SPEC_DIR, 'static'), 'static'),
]

datas = [(src, dst) for src, dst in datas if os.path.exists(src)]

binaries = []

try:
    import cv2
    cv2_path = os.path.dirname(cv2.__file__)
    if os.path.exists(os.path.join(cv2_path, 'data')):
        datas.append((os.path.join(cv2_path, 'data'), 'cv2/data'))
except ImportError:
    pass

a = Analysis(
    ['main.py'],
    pathex=[SPEC_DIR],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'scipy',
        'pandas',
        'IPython',
        'jupyter',
        'notebook',
        'pytest',
        'sphinx',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher,
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='STCAIVAPEdgeServer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(SPEC_DIR, 'assets', 'icon.ico') if os.path.exists(os.path.join(SPEC_DIR, 'assets', 'icon.ico')) else None,
    uac_admin=True,
)
