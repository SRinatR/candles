'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadAreaProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

const ACCEPTED_FILE_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'audio/*': ['.mp3', '.wav', '.ogg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt']
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 5;

const getFileIcon = (file: File) => {
  const type = file.type;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Video;
  if (type.startsWith('audio/')) return Music;
  if (type === 'application/pdf' || type.includes('document') || type.includes('sheet')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const validateFile = (file: File, maxSize: number): string | null => {
  if (file.size > maxSize) {
    return `File size exceeds ${formatFileSize(maxSize)} limit`;
  }
  
  const allowedTypes = Object.keys(ACCEPTED_FILE_TYPES);
  const isValidType = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'));
    }
    return file.type === type;
  });
  
  if (!isValidType) {
    return 'File type not supported';
  }
  
  return null;
};

export default function FileUploadArea({
  onFilesUploaded,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes,
  className,
  disabled = false
}: FileUploadAreaProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileId = Math.random().toString(36).substring(7);
    const uploadedFile: UploadedFile = {
      id: fileId,
      file,
      progress: 0,
      status: 'uploading'
    };

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'support');

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const response = await fetch('/api/support/attachments', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      return {
        ...uploadedFile,
        progress: 100,
        status: 'completed',
        url: result.url
      };
    } catch (error) {
      return {
        ...uploadedFile,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    for (const file of acceptedFiles) {
      const error = validateFile(file, maxSize);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    // Check max files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (errors.length > 0) {
      // Handle errors (you might want to show them in a toast or alert)
      console.error('File validation errors:', errors);
      return;
    }

    // Create initial file objects
    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files
    const uploadPromises = newFiles.map(async (fileObj) => {
      const result = await uploadFile(fileObj.file);
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? result : f)
      );
      return result;
    });

    const results = await Promise.all(uploadPromises);
    const completedFiles = results.filter(f => f.status === 'completed');
    
    if (completedFiles.length > 0) {
      onFilesUploaded(completedFiles);
    }
  }, [uploadedFiles, maxFiles, maxSize, disabled, onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: acceptedTypes ? 
      acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) : 
      ACCEPTED_FILE_TYPES,
    maxFiles,
    maxSize,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false)
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = async (fileId: string) => {
    const fileObj = uploadedFiles.find(f => f.id === fileId);
    if (!fileObj) return;

    setUploadedFiles(prev => 
      prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      )
    );

    const result = await uploadFile(fileObj.file);
    setUploadedFiles(prev => 
      prev.map(f => f.id === fileId ? result : f)
    );

    if (result.status === 'completed') {
      onFilesUploaded([result]);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-primary/5',
          dropzoneActive && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed',
          isDragActive && 'border-primary bg-primary/10'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {dropzoneActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse files
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Maximum {maxFiles} files, {formatFileSize(maxSize)} each</p>
            <p>Supported: Images, Videos, Audio, Documents (PDF, DOC, XLS, TXT)</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileObj) => {
              const FileIcon = getFileIcon(fileObj.file);
              
              return (
                <div key={fileObj.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {fileObj.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {fileObj.status === 'completed' && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Uploaded
                          </Badge>
                        )}
                        {fileObj.status === 'error' && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileObj.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(fileObj.file.size)}</span>
                      {fileObj.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <span>{fileObj.progress}%</span>
                        </>
                      )}
                    </div>
                    
                    {fileObj.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={fileObj.progress} className="h-1" />
                      </div>
                    )}
                    
                    {fileObj.status === 'error' && fileObj.error && (
                      <div className="mt-2">
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            {fileObj.error}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => retryUpload(fileObj.id)}
                              className="h-auto p-0 ml-2 text-xs"
                            >
                              Retry
                            </Button>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}