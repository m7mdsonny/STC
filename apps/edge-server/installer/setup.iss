; STC AI-VAP Edge Server - Inno Setup Script
; Professional Windows Installer

#define MyAppName "STC AI-VAP Edge Server"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "STC Solutions"
#define MyAppURL "https://stc-solutions.com"
#define MyAppExeName "STCAIVAPEdgeServer.exe"
#define MyAppServiceName "STCAIVAPEdgeServer"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/support
AppUpdatesURL={#MyAppURL}/updates
DefaultDirName={autopf}\STC Solutions\AI-VAP Edge Server
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=STC-AI-VAP-EdgeServer-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
MinVersion=10.0
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} Setup
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "firewallrule"; Description: "Add Windows Firewall rule"; GroupDescription: "Network:"; Flags: checkedonce
Name: "autostart"; Description: "Start service on Windows startup"; GroupDescription: "Service:"; Flags: checkedonce

[Files]
Source: "..\dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

[Dirs]
Name: "{app}\logs"; Permissions: everyone-full
Name: "{app}\data"; Permissions: everyone-full

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Configuration"; Filename: "http://127.0.0.1:8080/setup"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""{#MyAppName}"" dir=in action=allow protocol=TCP localport=8080"; Flags: runhidden; Tasks: firewallrule
Filename: "{app}\{#MyAppExeName}"; Parameters: "install"; Flags: runhidden waituntilterminated
Filename: "{sys}\sc.exe"; Parameters: "config {#MyAppServiceName} start=auto"; Flags: runhidden; Tasks: autostart
Filename: "{sys}\net.exe"; Parameters: "start {#MyAppServiceName}"; Flags: runhidden nowait
Filename: "http://127.0.0.1:8080/setup"; Description: "Open Configuration"; Flags: postinstall shellexec nowait skipifsilent

[UninstallRun]
Filename: "{sys}\net.exe"; Parameters: "stop {#MyAppServiceName}"; Flags: runhidden
Filename: "{app}\{#MyAppExeName}"; Parameters: "remove"; Flags: runhidden waituntilterminated
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName}"""; Flags: runhidden

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
Type: filesandordirs; Name: "{app}\data"
Type: dirifempty; Name: "{app}"

[Code]
function IsServiceInstalled(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec('sc.exe', 'query {#MyAppServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and (ResultCode = 0);
end;

function IsServiceRunning(): Boolean;
var
  ResultCode: Integer;
begin
  Result := False;
  if Exec('sc.exe', 'query {#MyAppServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
    Result := ResultCode = 0;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  if IsServiceInstalled() then
  begin
    if IsServiceRunning() then
    begin
      Exec('net.exe', 'stop {#MyAppServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Sleep(2000);
    end;
    Exec(ExpandConstant('{app}\{#MyAppExeName}'), 'remove', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(1000);
  end;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  if IsServiceRunning() then
  begin
    Exec('net.exe', 'stop {#MyAppServiceName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    Sleep(2000);
  end;
end;

procedure InitializeWizard();
begin
  WizardForm.WelcomeLabel2.Caption :=
    'This wizard will install {#MyAppName} on your computer.' + #13#10 + #13#10 +
    'The Edge Server processes video streams locally using AI and syncs results to the cloud.' + #13#10 + #13#10 +
    'Requirements:' + #13#10 +
    '  - Windows 10/11 (64-bit)' + #13#10 +
    '  - 8 GB RAM minimum' + #13#10 +
    '  - Internet connection' + #13#10 + #13#10 +
    'Click Next to continue.';
end;
