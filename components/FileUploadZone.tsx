'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadZoneProps {
  onUploadComplete: (storagePath: string) => void;
  onUploadError: (error: string) => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

export default function FileUploadZone({ onUploadComplete, onUploadError }: FileUploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Client-side validation (UX only — server re-validates) ────────────────
  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, or WebP images are accepted.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must not exceed ${MAX_SIZE_MB}MB.`;
    }
    if (file.size === 0) {
      return 'File cannot be empty.';
    }
    return null;
  }

  const handleFile = useCallback(async (file: File) => {
    setErrorMessage(null);

    // Client-side validation
    const validationError = validateFile(file);
    if (validationError) {
      setState('error');
      setErrorMessage(validationError);
      onUploadError(validationError);
      return;
    }

    // Generate local preview (DOMPurify not needed — we use createObjectURL, not innerHTML)
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setFileName(file.name.slice(0, 50)); // Truncate display name
    setState('uploading');

    // ── Upload to secure server endpoint ─────────────────────────────────
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // NO Content-Type header — browser sets correct multipart boundary
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Upload failed.');
      }

      setState('success');
      onUploadComplete(data.path);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setState('error');
      setErrorMessage(message);
      onUploadError(message);
      setPreview(null);
    }
  }, [onUploadComplete, onUploadError]);

  // ── Drag and drop handlers ────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === 'dragging') setState('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
    else setState('idle');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setState('idle');
    setPreview(null);
    setFileName(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* ── Drop zone ──────────────────────────────────────────────────────── */}
      {state !== 'success' ? (
        <div
          className={`drop-zone cursor-pointer transition-all duration-200 ${
            state === 'dragging' ? 'border-cyan-500 bg-cyan-500/5' : ''
          } ${state === 'error' ? 'border-red-500/50 bg-red-500/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          aria-label="Upload payment screenshot"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
            id="payment-screenshot-input"
          />

          {state === 'uploading' ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              <p className="text-zinc-400 text-sm">Uploading securely...</p>
            </div>
          ) : state === 'error' ? (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <div className="text-center">
                <p className="text-red-400 font-medium text-sm">{errorMessage}</p>
                <p className="text-zinc-500 text-xs mt-1">Click to try again</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(6, 182, 212,0.08)', border: '1px solid rgba(6, 182, 212,0.15)' }}
              >
                <Upload className="w-8 h-8 text-cyan-500" />
              </div>
              <div className="text-center">
                <p className="text-zinc-200 font-semibold text-sm">
                  Drop your payment screenshot here
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  or click to browse — JPG, PNG, WebP up to 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Success state — show preview ──────────────────────────────────── */
        <div
          className="relative rounded-2xl overflow-hidden border"
          style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}
        >
          {/* Preview image */}
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Payment screenshot preview"
              className="w-full max-h-64 object-cover"
            />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <p className="text-white font-semibold text-sm">Screenshot uploaded!</p>
              {fileName && (
                <p className="text-zinc-300 text-xs font-mono">{fileName}</p>
              )}
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={clearFile}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-500/80 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Security note ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3">
        <FileImage className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
        <p className="text-xs text-zinc-600">
          Files are uploaded securely to encrypted storage. Only administrators can view your screenshot.
        </p>
      </div>
    </div>
  );
}
