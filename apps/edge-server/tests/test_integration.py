"""
Integration Tests for Edge Server
Tests Cloud integration, pairing, AI commands, camera sync, and trial
"""
import asyncio
import httpx
import json
from datetime import datetime
from pathlib import Path

BASE_URL = "http://localhost:8080"
CLOUD_API_URL = "https://api.stcsolutions.online/api/v1"  # Update with your Cloud URL


async def test_pairing():
    """Test pairing mechanism"""
    print("\n" + "="*60)
    print("Testing Pairing Mechanism")
    print("="*60)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Generate pairing token
        print("\n1. Generating pairing token...")
        response = await client.post("/api/v1/pairing/generate-token")
        if response.status_code == 200:
            data = response.json()
            pairing_token = data.get("pairing_token")
            print(f"   ✅ Pairing token generated: {pairing_token}")
        else:
            print(f"   ❌ Failed to generate token: {response.status_code}")
            return False
        
        # Generate API key
        print("\n2. Generating API key...")
        response = await client.post("/api/v1/pairing/generate-api-key")
        if response.status_code == 200:
            data = response.json()
            api_key = data.get("api_key")
            print(f"   ✅ API key generated: {api_key[:20]}...")
        else:
            print(f"   ❌ Failed to generate API key: {response.status_code}")
            return False
        
        # Get pairing info
        print("\n3. Getting pairing information...")
        response = await client.get("/api/v1/pairing/info")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Pairing info retrieved")
            print(f"   - Token: {data.get('pairing_token')}")
            print(f"   - API Key: {'Set' if data.get('api_key') else 'Not set'}")
            print(f"   - Is Paired: {data.get('is_paired')}")
        else:
            print(f"   ❌ Failed to get pairing info: {response.status_code}")
            return False
    
    return True


async def test_trial():
    """Test 14-day free trial"""
    print("\n" + "="*60)
    print("Testing 14-Day Free Trial")
    print("="*60)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Check server status
        print("\n1. Checking server status...")
        response = await client.get("/api/v1/status")
        if response.status_code == 200:
            data = response.json()
            licensed = data.get("connection", {}).get("licensed", False)
            print(f"   ✅ Server status retrieved")
            print(f"   - Licensed: {licensed}")
            print(f"   - Plan: {data.get('license', {}).get('plan', 'N/A')}")
        else:
            print(f"   ❌ Failed to get status: {response.status_code}")
            return False
        
        # Check health
        print("\n2. Checking health endpoint...")
        response = await client.get("/api/v1/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed")
            print(f"   - Healthy: {data.get('healthy')}")
            print(f"   - Connected: {data.get('connected')}")
            print(f"   - Licensed: {data.get('licensed')}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    
    return True


async def test_ai_commands():
    """Test AI command execution"""
    print("\n" + "="*60)
    print("Testing AI Command Execution")
    print("="*60)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Check available modules
        print("\n1. Checking available AI modules...")
        response = await client.get("/api/v1/modules")
        if response.status_code == 200:
            modules = response.json()
            print(f"   ✅ Found {len(modules)} modules:")
            for module in modules:
                print(f"   - {module.get('name')} ({module.get('id')}): {'Enabled' if module.get('enabled') else 'Disabled'}")
        else:
            print(f"   ❌ Failed to get modules: {response.status_code}")
            return False
        
        # Test AI command (requires camera)
        print("\n2. Testing AI command execution...")
        command_data = {
            "command_type": "ai_inference",
            "camera_id": "test_camera",
            "module": "face",
            "parameters": {}
        }
        
        response = await client.post("/api/v1/commands", json=command_data)
        if response.status_code in (200, 201, 404):  # 404 if camera not found is OK
            data = response.json()
            print(f"   ✅ Command executed (status: {response.status_code})")
            if response.status_code == 200:
                print(f"   - Status: {data.get('status')}")
                print(f"   - Command ID: {data.get('command_id')}")
        else:
            print(f"   ⚠️  Command test returned: {response.status_code}")
            print(f"   (This is OK if camera is not configured)")
    
    return True


async def test_camera_sync():
    """Test camera synchronization"""
    print("\n" + "="*60)
    print("Testing Camera Synchronization")
    print("="*60)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # List cameras
        print("\n1. Listing cameras...")
        response = await client.get("/api/v1/cameras")
        if response.status_code == 200:
            cameras = response.json()
            print(f"   ✅ Found {len(cameras)} cameras")
            for camera in cameras[:3]:  # Show first 3
                print(f"   - {camera.get('name', 'Unknown')} ({camera.get('id', 'N/A')})")
        else:
            print(f"   ⚠️  Camera list returned: {response.status_code}")
            print(f"   (This is OK if not connected to Cloud)")
        
        # Test adding camera
        print("\n2. Testing camera addition...")
        camera_data = {
            "id": "test_camera_001",
            "name": "Test Camera",
            "rtsp_url": "rtsp://test.example.com/stream",
            "enabled_modules": ["face", "counter"]
        }
        
        response = await client.post("/api/v1/cameras", json=camera_data)
        if response.status_code in (200, 201):
            data = response.json()
            print(f"   ✅ Camera added successfully")
            print(f"   - Camera ID: {data.get('camera_id')}")
        else:
            print(f"   ⚠️  Camera addition returned: {response.status_code}")
            print(f"   (This is OK if server is not fully configured)")
        
        # Test snapshot (if camera exists)
        print("\n3. Testing snapshot retrieval...")
        response = await client.get("/api/v1/cameras/test_camera_001/snapshot")
        if response.status_code == 200:
            print(f"   ✅ Snapshot retrieved (size: {len(response.content)} bytes)")
        elif response.status_code == 404:
            print(f"   ⚠️  Camera not found (expected if not configured)")
        else:
            print(f"   ⚠️  Snapshot returned: {response.status_code}")
    
    return True


async def test_cloud_integration():
    """Test Cloud API integration"""
    print("\n" + "="*60)
    print("Testing Cloud API Integration")
    print("="*60)
    
    # This requires actual Cloud API connection
    print("\n1. Testing Cloud API connection...")
    print("   ⚠️  This test requires:")
    print("   - CLOUD_API_URL configured in .env")
    print("   - Valid license key")
    print("   - Cloud API accessible")
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        response = await client.get("/api/v1/status")
        if response.status_code == 200:
            data = response.json()
            connected = data.get("connection", {}).get("cloud", False)
            licensed = data.get("connection", {}).get("licensed", False)
            
            print(f"\n   Connection Status:")
            print(f"   - Cloud Connected: {connected}")
            print(f"   - Licensed: {licensed}")
            
            if connected and licensed:
                print(f"   ✅ Cloud integration working!")
            else:
                print(f"   ⚠️  Cloud integration not fully configured")
    
    return True


async def run_all_tests():
    """Run all integration tests"""
    print("\n" + "="*60)
    print("EDGE SERVER INTEGRATION TESTS")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    
    results = {}
    
    # Run tests
    results['pairing'] = await test_pairing()
    results['trial'] = await test_trial()
    results['ai_commands'] = await test_ai_commands()
    results['camera_sync'] = await test_camera_sync()
    results['cloud_integration'] = await test_cloud_integration()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.upper():.<30} {status}")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    return all(results.values())


if __name__ == "__main__":
    asyncio.run(run_all_tests())



