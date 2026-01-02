import sys
import os
from pathlib import Path


def handle_service_command(command: str):
    try:
        import win32serviceutil
        import win32service
        import win32event
        import servicemanager
    except ImportError:
        print("Error: pywin32 is required for Windows service")
        print("Install it with: pip install pywin32")
        sys.exit(1)

    BASE_DIR = Path(__file__).parent.parent.parent
    sys.path.insert(0, str(BASE_DIR))
    os.chdir(BASE_DIR)

    class STCEdgeService(win32serviceutil.ServiceFramework):
        _svc_name_ = "STCAIVAPEdgeServer"
        _svc_display_name_ = "STC AI-VAP Edge Server"
        _svc_description_ = "STC AI-VAP Video Analytics Edge Processing Server"

        def __init__(self, args):
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.stop_event = win32event.CreateEvent(None, 0, 0, None)
            self.server = None

        def SvcStop(self):
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            win32event.SetEvent(self.stop_event)

        def SvcDoRun(self):
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, '')
            )
            self.main()

        def main(self):
            import uvicorn
            from config.settings import settings

            config = uvicorn.Config(
                "main:app",
                host=settings.SERVER_HOST,
                port=settings.SERVER_PORT,
                log_level="warning"
            )

            self.server = uvicorn.Server(config)

            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                loop.run_until_complete(self.server.serve())
            except Exception as e:
                servicemanager.LogErrorMsg(f"Server error: {e}")
            finally:
                loop.close()

    if command == "install":
        print("Installing STC AI-VAP Edge Server service...")
        win32serviceutil.HandleCommandLine(STCEdgeService, argv=["", "install"])
        print("\nService installed successfully!")
        print("Start with: net start STCAIVAPEdgeServer")

    elif command == "remove":
        print("Removing STC AI-VAP Edge Server service...")
        win32serviceutil.HandleCommandLine(STCEdgeService, argv=["", "remove"])
        print("Service removed.")

    elif command == "start":
        print("Starting service...")
        win32serviceutil.HandleCommandLine(STCEdgeService, argv=["", "start"])

    elif command == "stop":
        print("Stopping service...")
        win32serviceutil.HandleCommandLine(STCEdgeService, argv=["", "stop"])


if __name__ == "__main__":
    if len(sys.argv) > 1:
        handle_service_command(sys.argv[1])
