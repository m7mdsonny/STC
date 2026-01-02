# Market Module - Implementation Summary

**Date**: 2025-01-30  
**Status**: ✅ **IMPLEMENTATION COMPLETE**

---

## Overview

The Market Module is a production-grade Enterprise AI module for the STC AI-VAP platform. It implements a multi-stage AI pipeline for detecting suspicious behavior in retail environments.

**Important**: The module NEVER accuses theft. It only reports risk-based suspicious behavior. Final decisions are always human.

---

## Module Structure

```
apps/edge-server/app/ai/modules/
  market/
    __init__.py
    config.yaml
    person_tracking.py      # Stage 1: Person detection & tracking
    shelf_interaction.py    # Stage 2: Shelf interaction detection
    temporal_filter.py      # Stage 3: Temporal filtering
    pose_concealment.py     # Stage 4: Pose-based concealment detection
    zone_logic.py           # Stage 5: Zone logic (Shelf/Checkout/Exit)
    risk_engine.py          # Stage 6: Weighted risk scoring
    event_dispatcher.py     # Stage 7: Event formatting & snapshots
  market.py                 # Main module (integrates all stages)
```

---

## Multi-Stage Pipeline

### Stage 1: Person Detection & Tracking
- **Component**: `person_tracking.py`
- **Technology**: YOLOv8 + ByteTrack (or fallback tracker)
- **Features**:
  - Detects people in frame
  - Tracks across frames with track_id
  - Tracks across zones (Shelf, Checkout, Exit)
  - NO identity persistence
  - track_id expires automatically (5 minutes default)

### Stage 2: Shelf Interaction Detection
- **Component**: `shelf_interaction.py`
- **Method**: Hand-object interaction detection
- **Validation**:
  - Spatial overlap (hand ↔ shelf)
  - Temporal validation (≥ 2-3 seconds)
  - Ignores accidental or brief touches

### Stage 3: Temporal Filtering
- **Component**: `temporal_filter.py`
- **Functions**:
  - Ignores short interactions
  - Confirms sustained possession
  - Requires continuous tracking
  - Discards broken track chains

### Stage 4: Pose-Based Concealment Detection
- **Component**: `pose_concealment.py`
- **Technology**: MediaPipe Pose (or fallback)
- **Detection**:
  - Hand movement toward pocket/waist/bag
  - Object visibility disappears near body
  - NO face analysis

### Stage 5: Zone Logic
- **Component**: `zone_logic.py`
- **Zones**: Shelf, Checkout, Exit
- **Logic**:
  - Person exits store
  - Person NEVER enters checkout zone
  - Object was previously picked

### Stage 6: Risk Scoring Engine
- **Component**: `risk_engine.py`
- **Method**: Weighted scoring (NOT IF/ELSE)
- **Weights** (configurable):
  - Object picked: +30
  - Object not returned: +15
  - Concealment motion: +40
  - Exit without checkout: +35
- **Risk Levels**:
  - 0-59: Low
  - 60-89: Medium
  - 90-109: High
  - 110+: Critical
- **Alerts**: Only High & Critical generate alerts

### Stage 7: Event Dispatcher
- **Component**: `event_dispatcher.py`
- **Functions**:
  - Formats events according to Edge standard
  - Captures snapshots (High/Critical only)
  - Blurs faces automatically
  - Creates alerts

---

## Configuration

Configuration is loaded from `config.yaml`:

```yaml
risk_weights:
  object_picked: 30
  object_not_returned: 15
  concealment_motion: 40
  exit_without_checkout: 35

risk_thresholds:
  low: 0
  medium: 60
  high: 90
  critical: 110
```

---

## Event Output Format

Standard Edge event format:

```json
{
  "module": "market",
  "event_type": "suspicious_behavior",
  "risk_score": 118,
  "risk_level": "critical",
  "track_id": 42,
  "camera_id": 6,
  "confidence": 0.91,
  "actions": [
    "object_pick",
    "concealment",
    "exit_without_checkout"
  ],
  "timestamp": "2025-01-30T12:34:56Z",
  "metadata": {
    "contributing_factors": ["object_picked", "concealment_motion", "exit_without_checkout"],
    "interactions_count": 2,
    "concealments_count": 1,
    "zone_events_count": 1
  }
}
```

---

## Security & Privacy

✅ **Implemented**:
- NO facial recognition
- NO identity persistence
- NO biometric data storage
- Face blurring in snapshots
- track_id expires automatically
- NO accusations of theft

✅ **Wording**:
- "Suspicious Behavior"
- "Risk Event"
- "Loss Prevention Alert"

---

## Integration

### Registration
Module is registered in `AIModuleManager`:
```python
self.modules['market'] = MarketModule(
    confidence_threshold=settings.OBJECT_CONFIDENCE
)
```

### Usage
Module is enabled via license configuration:
```python
enabled_modules = ['market', 'other_modules']
ai_manager.enable_modules(enabled_modules)
```

---

## Dependencies

### Required
- `ultralytics` (YOLO)
- `numpy`
- `opencv-python` (cv2)
- `loguru`

### Optional
- `byte_tracker` (for advanced tracking)
- `mediapipe` (for pose estimation)

### Fallbacks
- Simple IoU-based tracker if ByteTrack unavailable
- Simple hand position estimation if MediaPipe unavailable

---

## Error Handling

✅ **Graceful Failure**:
- Module continues if sub-component fails
- Errors logged but don't crash system
- Configurable via `behavior.graceful_failure`

---

## Testing Checklist

- [ ] Module loads without errors
- [ ] Person tracking works
- [ ] Shelf interaction detection works
- [ ] Temporal filtering works
- [ ] Concealment detection works
- [ ] Zone logic works
- [ ] Risk scoring works
- [ ] Events generated correctly
- [ ] Snapshots captured (High/Critical only)
- [ ] Faces blurred in snapshots
- [ ] No breaking changes to existing modules
- [ ] No database schema changes
- [ ] No API changes

---

## Status

✅ **IMPLEMENTATION COMPLETE**

All components implemented:
- ✅ Person tracking
- ✅ Shelf interaction detection
- ✅ Temporal filtering
- ✅ Pose-based concealment
- ✅ Zone logic
- ✅ Risk scoring engine
- ✅ Event dispatcher
- ✅ Configuration system
- ✅ Module registration

**Ready for**: Testing and integration

---

**Implementation Date**: 2025-01-30  
**Module ID**: `market`  
**Module Name**: "Market - Suspicious Behavior Detection"
