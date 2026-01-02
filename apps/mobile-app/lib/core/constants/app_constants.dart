class AppConstants {
  AppConstants._();

  static const String appName = 'STC AI-VAP';
  static const String appVersion = '1.0.0';
  static const String companyName = 'STC Solutions';
  static const String companyWebsite = 'www.stcsolutions.net';
  static const String companyPhone = '01016154999';
  static const String copyright = 'STC Solutions © 2024';

  static const int splashDuration = 3;
  static const int cameraCheckInterval = 60;
  static const int serverCheckInterval = 30;
  static const int alertFetchInterval = 10;

  static const Duration requestTimeout = Duration(seconds: 30);
  static const Duration connectTimeout = Duration(seconds: 15);

  static const int maxRetryAttempts = 3;
  static const int retryDelay = 2;

  static const List<int> videoQualities = [1080, 720, 480, 360];
  static const int defaultVideoQuality = 720;

  static const int paginationLimit = 20;
  static const int maxUploadSize = 10485760;

  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';
  static const String notificationKey = 'notifications_enabled';
  static const String biometricsKey = 'biometrics_enabled';

  static const String dateFormat = 'yyyy-MM-dd';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String displayDateFormat = 'dd/MM/yyyy';
  static const String displayTimeFormat = 'hh:mm a';
  static const String displayDateTimeFormat = 'dd/MM/yyyy hh:mm a';
}
