# Notification Sound Map

## Overview
Mobile App supports different notification sounds based on alert type and severity level.

## Sound Files

Located in: `assets/sounds/`

| File | Alert Level | Use Case |
|------|-------------|----------|
| `alert_critical.mp3` | Critical | Fire, Intrusion, Critical alerts |
| `alert_high.mp3` | High | High priority alerts, Loitering, Crowd |
| `alert_medium.mp3` | Medium | Face recognition, Vehicle recognition, Default |
| `alert_low.mp3` | Low | People counter, Info alerts |

## Sound Selection Logic

### By Alert Level (Priority)
1. **Critical**: `alert_critical.mp3`
2. **High**: `alert_high.mp3`
3. **Medium**: `alert_medium.mp3`
4. **Low**: `alert_low.mp3`

### By Alert Type (Fallback)
If level not specified, use type mapping:
- `fire_detection` → `alert_critical`
- `intrusion_detection` → `alert_critical`
- `camera_offline` → `alert_high`
- `camera_online` → `alert_medium`
- `face_recognition` → `alert_medium`
- `vehicle_recognition` → `alert_medium`
- `people_counter` → `alert_low`
- `attendance` → `alert_medium`
- `loitering` → `alert_high`
- `crowd_detection` → `alert_high`
- `object_detection` → `alert_medium`

## Implementation

### NotificationService
```dart
String _getNotificationSound(String level) {
  switch (level.toLowerCase()) {
    case 'critical': return 'alert_critical';
    case 'high': return 'alert_high';
    case 'medium': return 'alert_medium';
    case 'low': return 'alert_low';
    default: return 'alert_medium';
  }
}
```

### NotificationSoundSettings
- Custom sound per alert type
- Custom sound per alert level
- Global enable/disable toggle
- Reset to defaults

## User Settings

### Settings Screen
- `/settings/notification-sounds`
- Per-type sound selection
- Per-level sound selection
- Global toggle
- Test sound playback

## Sound Behavior

### Foreground
- Local notification with sound
- Sound plays immediately
- Respects user settings

### Background
- FCM notification with sound
- Sound plays via system notification
- Respects user settings

### App Killed
- FCM notification with sound
- Sound plays via system notification
- Respects user settings

## Platform Differences

### Android
- Uses `RawResourceAndroidNotificationSound`
- Sound file must be in `assets/sounds/`
- Referenced by name without extension

### iOS
- Uses `DarwinNotificationDetails`
- Sound file must be in bundle
- May need additional configuration

## Testing

### Test Cases
- [ ] Critical alert plays `alert_critical.mp3`
- [ ] High alert plays `alert_high.mp3`
- [ ] Medium alert plays `alert_medium.mp3`
- [ ] Low alert plays `alert_low.mp3`
- [ ] Custom sound per type works
- [ ] Custom sound per level works
- [ ] Global disable mutes all sounds
- [ ] Foreground notification plays sound
- [ ] Background notification plays sound
- [ ] App killed notification plays sound

## Future Enhancements

1. **Custom Sound Upload**: Allow users to upload custom sounds
2. **Sound Preview**: Preview sound before selecting
3. **Vibration Patterns**: Different patterns per alert level
4. **Volume Control**: Separate volume for notifications
5. **Quiet Hours**: Disable sounds during specific hours
