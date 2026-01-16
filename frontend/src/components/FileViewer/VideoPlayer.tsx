import { useState } from 'react';

interface VideoPlayerProps {
  fileUrl: string;
  fileName?: string;
}

export function VideoPlayer({ fileUrl, fileName }: VideoPlayerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError('Не удалось загрузить видео файл. Попробуйте скачать для просмотра.');
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleCanPlay = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 bg-[#1A2332] rounded-lg">
        <p className="text-red-400 mb-2">{error}</p>
        <a
          href={fileUrl}
          download
          className="text-[#D4A574] hover:text-[#E8C297] underline"
        >
          Скачать видео
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* File name */}
      {fileName && (
        <h3 className="text-[#F1F5F9] font-medium mb-4 text-center truncate max-w-full">
          {fileName}
        </h3>
      )}

      {/* Video container */}
      <div className="relative w-full max-w-4xl bg-[#0F1419] rounded-lg overflow-hidden border border-[#D4A574]/20">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1419]/80 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#D4A574] border-t-transparent rounded-full animate-spin" />
              <span className="text-[#94A3B8]">Загрузка видео...</span>
            </div>
          </div>
        )}

        {/* HTML5 Video Player */}
        <video
          src={fileUrl}
          controls
          preload="metadata"
          onError={handleError}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          className="w-full max-h-[70vh] object-contain"
          style={{ aspectRatio: '16/9' }}
        >
          <p className="text-[#64748B]">
            Ваш браузер не поддерживает воспроизведение видео.
          </p>
        </video>
      </div>

      {/* Video info */}
      <p className="mt-2 text-xs text-[#64748B]">
        Используйте стандартные элементы управления для воспроизведения
      </p>
    </div>
  );
}

export default VideoPlayer;
