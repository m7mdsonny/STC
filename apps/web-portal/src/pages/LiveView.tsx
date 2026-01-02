import { useState, useEffect, useRef } from 'react';
import { MonitorPlay, Grid, Maximize2, Volume2, VolumeX, Camera, AlertTriangle, Settings } from 'lucide-react';
import { camerasApi } from '../lib/api/cameras';
import { edgeServersApi } from '../lib/api/edgeServers';
import { edgeServerService } from '../lib/edgeServer';
import { useAuth } from '../contexts/AuthContext';
import type { Camera as CameraType } from '../types/database';

type LayoutType = '1x1' | '2x2' | '3x3' | '4x4';

const LAYOUTS: { id: LayoutType; label: string; cols: number }[] = [
  { id: '1x1', label: '1', cols: 1 },
  { id: '2x2', label: '4', cols: 2 },
  { id: '3x3', label: '9', cols: 3 },
  { id: '4x4', label: '16', cols: 4 },
];

export function LiveView() {
  const { organization } = useAuth();
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [mutedCameras, setMutedCameras] = useState<Set<string>>(new Set());
  const [streamUrls, setStreamUrls] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    if (organization) {
      fetchCameras();
      setupEdgeServer();
    }
  }, [organization]);

  const setupEdgeServer = async () => {
    try {
      const result = await edgeServersApi.getEdgeServers({ status: 'online', per_page: 1 });
      const servers = result.data || [];
      if (servers.length > 0 && servers[0].ip_address) {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        await edgeServerService.setServerUrl(`${protocol}//${servers[0].ip_address}:8000`);
      }
    } catch (error) {
      console.error('Failed to setup edge server:', error);
    }
  };

  const fetchCameras = async () => {
    setLoading(true);
    try {
      const result = await camerasApi.getCameras({
        status: 'online',
      });
      const camerasList = result.data || [];
      setCameras(camerasList);
      
      // Fetch stream URLs for each camera
      const urls: Record<string, string> = {};
      for (const camera of camerasList) {
        try {
          const streamUrl = await camerasApi.getStreamUrl(camera.id);
          if (streamUrl) {
            urls[camera.id] = streamUrl;
          }
        } catch (error) {
          console.error(`Failed to get stream URL for camera ${camera.id}:`, error);
        }
      }
      setStreamUrls(urls);
    } catch (error) {
      console.error('Failed to fetch cameras:', error);
    }
    setLoading(false);
  };

  const toggleMute = (cameraId: string) => {
    setMutedCameras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId);
      } else {
        newSet.add(cameraId);
      }
      return newSet;
    });
  };

  const currentLayout = LAYOUTS.find(l => l.id === layout) || LAYOUTS[1];
  const maxCameras = currentLayout.cols * currentLayout.cols;
  const displayCameras = cameras.slice(0, maxCameras);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">البث المباشر</h1>
          <p className="text-white/60">مشاهدة الكاميرات في الوقت الفعلي</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60 ml-2">التخطيط:</span>
          <div className="flex bg-white/5 rounded-lg p-1">
            {LAYOUTS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLayout(l.id)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  layout === l.id
                    ? 'bg-stc-gold text-stc-navy font-medium'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-stc-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cameras.length === 0 ? (
        <div className="card p-12 text-center">
          <MonitorPlay className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">لا توجد كاميرات متصلة</h3>
          <p className="text-white/60">قم بتوصيل الكاميرات لمشاهدة البث المباشر</p>
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
          }}
        >
          {displayCameras.map((camera) => (
            <div
              key={camera.id}
              className="relative bg-black rounded-lg overflow-hidden group"
              style={{ aspectRatio: '16/9' }}
            >
              {streamUrls[camera.id] ? (
                <video
                  ref={(el) => { videoRefs.current[camera.id] = el; }}
                  src={streamUrls[camera.id]}
                  autoPlay
                  muted={mutedCameras.has(camera.id)}
                  playsInline
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Stream error for camera ${camera.id}:`, e);
                    delete streamUrls[camera.id];
                    setStreamUrls({ ...streamUrls });
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-stc-navy/50">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <p className="text-white/50 text-sm">جاري الاتصال...</p>
                  </div>
                </div>
              )}

              <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-white">{camera.name}</span>
                  </div>
                  <span className="text-xs text-white/60">{camera.resolution}</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMute(camera.id)}
                      className="p-1.5 hover:bg-white/20 rounded"
                    >
                      {mutedCameras.has(camera.id) ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedCamera(camera)}
                      className="p-1.5 hover:bg-white/20 rounded"
                    >
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    {camera.location && <span>{camera.location}</span>}
                  </div>
                </div>
              </div>

              {camera.enabled_modules && camera.enabled_modules.length > 0 && (
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {camera.enabled_modules.includes('fire') && (
                    <div className="p-1 bg-red-500/80 rounded" title="كشف الحريق">
                      <AlertTriangle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {Array.from({ length: maxCameras - displayCameras.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-white/5 rounded-lg flex items-center justify-center"
              style={{ aspectRatio: '16/9' }}
            >
              <div className="text-center">
                <Camera className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-sm">لا يوجد بث</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCamera && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedCamera(null)}
        >
          <div className="w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {selectedCamera && streamUrls[selectedCamera.id] ? (
                <video
                  src={streamUrls[selectedCamera.id]}
                  autoPlay
                  muted={mutedCameras.has(selectedCamera.id)}
                  playsInline
                  controls
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error(`Stream error for camera ${selectedCamera.id}:`, e);
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-white/30 mx-auto mb-2" />
                    <p className="text-white/50">{selectedCamera?.name}</p>
                    <p className="text-white/30 text-sm mt-1">جاري الاتصال...</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-medium">{selectedCamera.name}</span>
                  {selectedCamera.location && (
                    <span className="text-white/60">- {selectedCamera.location}</span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCamera(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                >
                  <span className="text-white">اغلاق</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
