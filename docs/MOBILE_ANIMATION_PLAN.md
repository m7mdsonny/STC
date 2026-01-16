# Mobile App Animation Plan

## Animation Principles

1. **Purposeful**: Every animation should have a purpose
2. **Subtle**: Don't distract from content
3. **Fast**: Keep animations under 300ms
4. **Smooth**: Use easing curves for natural motion
5. **Consistent**: Use same animation patterns throughout

## Animation Types

### 1. Page Transitions

#### Current: Basic GoRouter transitions
#### Target: Smooth fade + slide transitions

```dart
// Custom page transition
PageRouteBuilder(
  pageBuilder: (context, animation, secondaryAnimation) => page,
  transitionsBuilder: (context, animation, secondaryAnimation, child) {
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.0, 0.1),
          end: Offset.zero,
        ).animate(CurvedAnimation(
          parent: animation,
          curve: Curves.easeOut,
        )),
        child: child,
      ),
    );
  },
  transitionDuration: const Duration(milliseconds: 250),
);
```

### 2. Button Interactions

#### Current: Standard Material ripple
#### Target: Scale + haptic feedback

```dart
// Animated button press
GestureDetector(
  onTapDown: (_) {
    HapticFeedback.lightImpact();
    // Scale down animation
  },
  onTapUp: (_) {
    // Scale up animation
  },
  child: AnimatedScale(
    scale: _isPressed ? 0.95 : 1.0,
    duration: const Duration(milliseconds: 100),
    child: button,
  ),
);
```

### 3. List Item Animations

#### Current: Basic list rendering
#### Target: Staggered entrance animations

```dart
// Staggered list animation
ListView.builder(
  itemBuilder: (context, index) {
    return TweenAnimationBuilder(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + (index * 50)),
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        );
      },
      child: listItem,
    );
  },
);
```

### 4. Alert Card Animations

#### Current: Static cards
#### Target: Entrance + swipe animations

```dart
// Alert card entrance
AnimatedContainer(
  duration: const Duration(milliseconds: 300),
  curve: Curves.easeOut,
  child: Dismissible(
    key: Key(alert.id),
    direction: DismissDirection.endToStart,
    onDismissed: (direction) => _dismissAlert(alert),
    background: Container(
      color: Colors.red,
      alignment: Alignment.centerRight,
      child: const Icon(Icons.delete, color: Colors.white),
    ),
    child: alertCard,
  ),
);
```

### 5. Loading Animations

#### Current: CircularProgressIndicator
#### Target: Skeleton loading with shimmer

```dart
// Already implemented: ShimmerLoading
ShimmerLoading(
  width: double.infinity,
  height: 100,
  borderRadius: BorderRadius.circular(12),
)
```

### 6. Pull to Refresh

#### Current: Standard RefreshIndicator
#### Target: Custom animated refresh

```dart
// Custom refresh indicator
RefreshIndicator(
  onRefresh: () async {
    // Refresh logic
  },
  child: listView,
  // Custom colors and animation
)
```

## Animation Durations

| Animation Type | Duration | Curve |
|---------------|----------|-------|
| Page Transition | 250ms | easeOut |
| Button Press | 100ms | easeInOut |
| List Item Entrance | 300ms + stagger | easeOut |
| Alert Card Entrance | 300ms | easeOut |
| Loading Shimmer | Continuous | linear |
| Pull to Refresh | 400ms | easeOut |

## Easing Curves

- **easeOut**: Most common (page transitions, list items)
- **easeInOut**: Button interactions
- **linear**: Loading animations
- **elasticOut**: Special emphasis (optional)

## Haptic Feedback

### Light Impact
- Button taps
- List item selection
- Toggle switches

### Medium Impact
- Alert acknowledgment
- Alert resolution
- Important actions

### Heavy Impact
- Critical alerts
- Error states
- Confirmation dialogs

## Implementation Priority

### Phase 1 (High Priority)
1. ✅ Skeleton loading (already implemented)
2. Page transitions
3. Button press animations
4. List item entrance

### Phase 2 (Medium Priority)
5. Alert card animations
6. Pull to refresh animation
7. Haptic feedback

### Phase 3 (Low Priority)
8. Advanced gestures (swipe to dismiss)
9. Shared element transitions
10. Micro-interactions

## Performance Considerations

1. **Use AnimatedContainer** for simple animations
2. **Use AnimationController** for complex animations
3. **Avoid animations on long lists** (use lazy loading)
4. **Test on low-end devices** for performance
5. **Disable animations** if device is in power save mode

## Accessibility

1. **Respect system animation settings**
2. **Provide animation toggle** in settings
3. **Ensure animations don't cause motion sickness**
4. **Test with screen readers**
