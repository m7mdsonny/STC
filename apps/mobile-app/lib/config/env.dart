class Env {
  // Cloud API URL - Update with your production URL
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://api.stcsolutions.online/api/v1',
  );

  static const String appName = 'STC AI-VAP';
  static const String appVersion = '1.0.0';

  static const bool enableOfflineMode = true;
  static const bool enableDebugMode = false;

  // Firebase Configuration (if using Firebase)
  static const bool useFirebase = true;
  
  // Real-time updates
  static const bool enableRealtimeUpdates = true;
  static const int pollingIntervalSeconds = 30;
}
