import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/notification_sound_settings.dart';
import '../../../core/services/storage_service.dart';
import '../../../data/providers/app_providers.dart';
import '../../../shared/widgets/app_loading.dart';
import '../../../shared/widgets/app_error.dart';

class NotificationSoundSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSoundSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSoundSettingsScreen> createState() =>
      _NotificationSoundSettingsScreenState();
}

class _NotificationSoundSettingsScreenState
    extends ConsumerState<NotificationSoundSettingsScreen> {
  late NotificationSoundSettings _soundSettings;
  bool _soundsEnabled = true;
  bool _loading = true;

  // Alert types
  final List<Map<String, String>> _alertTypes = [
    {'id': 'critical', 'name': 'تنبيهات حرجة'},
    {'id': 'high', 'name': 'تنبيهات عالية'},
    {'id': 'medium', 'name': 'تنبيهات متوسطة'},
    {'id': 'low', 'name': 'تنبيهات منخفضة'},
    {'id': 'camera_offline', 'name': 'كاميرا غير متصلة'},
    {'id': 'camera_online', 'name': 'كاميرا متصلة'},
    {'id': 'fire_detection', 'name': 'كشف حريق'},
    {'id': 'intrusion_detection', 'name': 'كشف تسلل'},
    {'id': 'face_recognition', 'name': 'تعرف على وجه'},
    {'id': 'vehicle_recognition', 'name': 'تعرف على مركبة'},
    {'id': 'people_counter', 'name': 'عداد أشخاص'},
    {'id': 'attendance', 'name': 'حضور'},
    {'id': 'loitering', 'name': 'تجمهر'},
    {'id': 'crowd_detection', 'name': 'ازدحام'},
    {'id': 'object_detection', 'name': 'كشف أشياء'},
  ];

  Map<String, String> _selectedSounds = {};

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() => _loading = true);
    try {
      final storage = ref.read(storageServiceProvider);
      _soundSettings = NotificationSoundSettings(storage: storage);

      _soundsEnabled = await _soundSettings.areSoundsEnabled();

      // Load current sound settings
      for (final alertType in _alertTypes) {
        final sound = await _soundSettings.getSoundForAlert(
          type: alertType['id']!,
        );
        _selectedSounds[alertType['id']!] = sound;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ في تحميل الإعدادات: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        appBar: AppBar(title: Text('إعدادات أصوات الإشعارات')),
        body: AppLoading(),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('إعدادات أصوات الإشعارات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await _soundSettings.resetToDefaults();
              await _loadSettings();
            },
            tooltip: 'إعادة تعيين',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Global toggle
          Card(
            child: SwitchListTile(
              title: const Text('تفعيل أصوات الإشعارات'),
              subtitle: const Text('تشغيل/إيقاف جميع أصوات الإشعارات'),
              value: _soundsEnabled,
              onChanged: (value) async {
                await _soundSettings.setSoundsEnabled(value);
                setState(() => _soundsEnabled = value);
              },
            ),
          ),
          const SizedBox(height: 16),

          // Alert type sounds
          ..._alertTypes.map((alertType) {
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                title: Text(alertType['name']!),
                subtitle: Text(
                  'الصوت: ${_soundSettings.getSoundLabel(_selectedSounds[alertType['id']] ?? 'alert_medium')}',
                ),
                trailing: DropdownButton<String>(
                  value: _selectedSounds[alertType['id']] ?? 'alert_medium',
                  items: _soundSettings.getAvailableSounds().map((sound) {
                    return DropdownMenuItem(
                      value: sound,
                      child: Text(_soundSettings.getSoundLabel(sound)),
                    );
                  }).toList(),
                  onChanged: _soundsEnabled
                      ? (value) async {
                          if (value != null) {
                            await _soundSettings.setSoundForAlertType(
                              alertType['id']!,
                              value,
                            );
                            setState(() {
                              _selectedSounds[alertType['id']!] = value;
                            });
                          }
                        }
                      : null,
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}



