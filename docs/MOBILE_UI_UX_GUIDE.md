# Mobile App UI/UX Guide

## Design Principles

### 1. Clean & Minimal
- Remove unnecessary elements
- Use white space effectively
- Focus on essential information
- Clear visual hierarchy

### 2. Scalable
- Responsive layouts
- Flexible components
- Support different screen sizes
- Adaptive to content

### 3. Modern
- Material Design 3
- Smooth animations
- Consistent spacing
- Modern color palette

## Current Implementation Status

### ✅ Implemented
- **Dark/Light Theme**: Full support via `AppTheme`
- **Skeleton Loading**: `ShimmerLoading`, `CardShimmer`, `ListShimmer`
- **Empty States**: `AppEmptyState` widget
- **Navigation**: Bottom navigation bar with GoRouter
- **Color Scheme**: Consistent colors via `AppColors`

### ⚠️ Needs Improvement
- **Page Transitions**: Basic transitions, needs smooth animations
- **Button Interactions**: Standard Material buttons, needs haptic feedback
- **Alert Animations**: Basic card animations, needs entrance/exit animations
- **Loading States**: Basic CircularProgressIndicator, needs better loading UX

## Component Library

### Loading States

#### AppLoading
```dart
AppLoading(size: 50) // Circular progress indicator
```

#### ShimmerLoading
```dart
ShimmerLoading(
  width: 200,
  height: 100,
  borderRadius: BorderRadius.circular(12),
)
```

#### CardShimmer
```dart
CardShimmer() // Pre-built card skeleton
```

#### ListShimmer
```dart
ListShimmer(itemCount: 5) // List of card skeletons
```

### Empty States

#### AppEmptyState
```dart
AppEmptyState(
  title: 'لا توجد تنبيهات',
  message: 'لا توجد تنبيهات لعرضها حالياً',
  icon: Icons.notifications_none,
  onRetry: () => refresh(),
  retryText: 'إعادة المحاولة',
)
```

### Error States

#### AppError
```dart
AppError(
  message: 'فشل تحميل البيانات',
  onRetry: () => retry(),
)
```

## Navigation Structure

```
Splash Screen
  ↓
Login Screen
  ↓
Home Screen (Bottom Nav)
  ├── Home Tab
  ├── Cameras Tab
  ├── Alerts Tab
  ├── Analytics Tab
  └── Settings Tab
```

## Color Palette

### Light Theme
- Primary: `AppColors.primaryLight` (Navy Blue)
- Secondary: `AppColors.primaryGold` (Gold)
- Background: `AppColors.backgroundLight`
- Card: `AppColors.cardLight`
- Text: `AppColors.textDark`

### Dark Theme
- Primary: `AppColors.primaryGold` (Gold)
- Secondary: `AppColors.primaryNavy` (Navy Blue)
- Background: `AppColors.backgroundDark`
- Card: `AppColors.cardDark`
- Text: `AppColors.textLight`

## Typography

Using **Google Fonts - Alexandria**:
- Display: 32px, Bold
- Headline: 20-22px, Semi-bold
- Title: 14-16px, Medium
- Body: 14-16px, Regular
- Label: 12-14px, Medium

## Spacing System

- **XS**: 4px
- **S**: 8px
- **M**: 12px
- **L**: 16px
- **XL**: 24px
- **XXL**: 32px

## Border Radius

- **Small**: 8px
- **Medium**: 12px
- **Large**: 16px
- **XL**: 24px

## Shadows

### Light Theme
- Card: `Colors.black.withOpacity(0.05)`
- Elevation: 2-4

### Dark Theme
- Card: `Colors.black.withOpacity(0.3)`
- Elevation: 4-8

## Responsive Breakpoints

- **Small**: < 360px
- **Medium**: 360px - 600px
- **Large**: > 600px

## Accessibility

- Minimum touch target: 48x48dp
- Text contrast ratio: WCAG AA compliant
- Screen reader support: Semantic labels
- Font scaling: Support system font size

## Best Practices

1. **Consistent Spacing**: Use predefined spacing values
2. **Consistent Colors**: Use AppColors constants
3. **Consistent Typography**: Use Theme text styles
4. **Loading States**: Always show loading indicators
5. **Error Handling**: Show user-friendly error messages
6. **Empty States**: Provide helpful empty state messages
7. **Animations**: Keep animations subtle and purposeful
8. **Performance**: Optimize images and lazy load lists
