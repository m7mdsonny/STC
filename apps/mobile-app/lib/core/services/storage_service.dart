import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class StorageService {
  late final Box _box;
  late final SharedPreferences _prefs;

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox('app_storage');
    _prefs = await SharedPreferences.getInstance();
  }

  Future<void> saveToken(String token) async {
    await _box.put(AppConstants.tokenKey, token);
    await _prefs.setString(AppConstants.tokenKey, token);
  }

  Future<String?> getToken() async {
    return _box.get(AppConstants.tokenKey) as String?;
  }

  Future<void> clearToken() async {
    await _box.delete(AppConstants.tokenKey);
    await _prefs.remove(AppConstants.tokenKey);
  }

  Future<void> saveUser(String userData) async {
    await _box.put(AppConstants.userKey, userData);
  }

  Future<String?> getUser() async {
    return _box.get(AppConstants.userKey) as String?;
  }

  Future<void> clearUser() async {
    await _box.delete(AppConstants.userKey);
  }

  Future<void> saveThemeMode(String themeMode) async {
    await _prefs.setString(AppConstants.themeKey, themeMode);
  }

  String getThemeMode() {
    return _prefs.getString(AppConstants.themeKey) ?? 'light';
  }

  Future<void> saveNotificationEnabled(bool enabled) async {
    await _prefs.setBool(AppConstants.notificationKey, enabled);
  }

  bool getNotificationEnabled() {
    return _prefs.getBool(AppConstants.notificationKey) ?? true;
  }

  Future<void> saveBiometricsEnabled(bool enabled) async {
    await _prefs.setBool(AppConstants.biometricsKey, enabled);
  }

  bool getBiometricsEnabled() {
    return _prefs.getBool(AppConstants.biometricsKey) ?? false;
  }

  Future<void> saveString(String key, String value) async {
    await _box.put(key, value);
  }

  String? getString(String key) {
    return _box.get(key) as String?;
  }

  Future<void> saveBool(String key, bool value) async {
    await _box.put(key, value);
  }

  bool getBool(String key, {bool defaultValue = false}) {
    return _box.get(key, defaultValue: defaultValue) as bool;
  }

  Future<void> saveInt(String key, int value) async {
    await _box.put(key, value);
  }

  int getInt(String key, {int defaultValue = 0}) {
    return _box.get(key, defaultValue: defaultValue) as int;
  }

  Future<void> saveDouble(String key, double value) async {
    await _box.put(key, value);
  }

  double getDouble(String key, {double defaultValue = 0.0}) {
    return _box.get(key, defaultValue: defaultValue) as double;
  }

  Future<void> remove(String key) async {
    await _box.delete(key);
  }

  Future<void> clear() async {
    await _box.clear();
    await _prefs.clear();
  }

  bool containsKey(String key) {
    return _box.containsKey(key);
  }
}
