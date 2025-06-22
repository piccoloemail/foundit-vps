'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMemories } from '@/hooks/useMemories';
import YouTubePreview from './YouTubePreview';
import { isYouTubeUrl, getYouTubeVideoInfo, YouTubeVideoInfo } from '@/utils/youtube';
import { YouTubeVideoMetadata, generateAutoTags, cleanYouTubeDescription } from '@/utils/youtubeApi';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface NewMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MEMORY_TYPES = [
  { value: 'document', label: '📄 Document', placeholder: 'Add notes about your files or links (optional)' },
  { value: 'link', label: '🌐 Website', placeholder: 'Add notes about this website or link (optional)' },
  { value: 'video', label: '📺 Video', placeholder: 'Add notes about this video (optional)' },
  { value: 'note', label: '📝 Note', placeholder: 'Write your thoughts, ideas, or notes here...' },
] as const;

const CATEGORIES = [
  'Personal',
  'Work',
  'Learning',
  'Entertainment',
  'Research',
  'Ideas',
  'Tools',
  'Inspiration',
];

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video' | 'document' | 'other';
}

export default function NewMemoryModal({ isOpen, onClose }: NewMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'document' | 'link' | 'video' | 'note' | ''>('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [youtubeInfo, setYoutubeInfo] = useState<YouTubeVideoInfo | null>(null);
  const [youtubeMetadata, setYoutubeMetadata] = useState<YouTubeVideoMetadata | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string>('');
  const [enableTranscription, setEnableTranscription] = useState(true);
  const [manualTranscript, setManualTranscript] = useState('');
  const [showTranscriptInput, setShowTranscriptInput] = useState(false);
  
  // Website metadata states
  const [websiteMetadata, setWebsiteMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  
  // File upload states
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createMemory, checkForDuplicateYouTubeVideo } = useMemories();
  const { user } = useAuth();

  // Function to scrape website metadata
  const scrapeWebsiteMetadata = useCallback(async (url: string) => {
    try {
      setIsLoadingMetadata(true);
      console.log('🌐 Scraping metadata for:', url);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/scrape-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('📦 Response status:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📦 Full API response:', result);
      
      if (result.success && result.metadata) {
        console.log('✅ Website metadata extracted:', result.metadata);
        console.log('🖼️ Logo found:', result.metadata.logo);
        setWebsiteMetadata(result.metadata);
        
        // Auto-fill form fields if they're empty
        console.log('🔍 Current form state:', { title, content, category, tags });
        
        if (!title && result.metadata.title) {
          console.log('📝 Setting title:', result.metadata.title);
          setTitle(result.metadata.title);
        }
        
        // Set description in content field (user can add their notes here)
        if (!content && result.metadata.description) {
          console.log('📝 Setting description as placeholder in content');
          setContent(`${result.metadata.description}\n\n---\nMy notes:\n`);
        }
        
        // Auto-fill tags with extracted keywords
        if (!tags && result.metadata.autoTags && result.metadata.autoTags.length > 0) {
          console.log('📝 Setting auto tags:', result.metadata.autoTags);
          setTags(result.metadata.autoTags.join(', '));
        }
        
        if (!category) {
          console.log('📝 Setting category: Research');
          setCategory('Research'); // Default category for websites
        }
      } else {
        console.error('❌ Failed to extract metadata:', result.error);
        setWebsiteMetadata(null);
      }
    } catch (error) {
      console.error('❌ Error scraping website metadata:', error);
      setWebsiteMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  }, [title, content, category]);

  // Handle paste events
  useEffect(() => {
    if (!isOpen) return;
    
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      let hasHandledContent = false;
      
      for (const item of items) {
        // Handle images
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const fileName = `screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
            const file = new File([blob], fileName, { type: blob.type });
            handleFileSelect(new DataTransfer().files);
            
            // Create a FileList-like object
            const dt = new DataTransfer();
            dt.items.add(file);
            handleFileSelect(dt.files);
            hasHandledContent = true;
          }
        }
        // Handle text
        else if (item.type === 'text/plain' && type !== 'note') {
          const text = await new Promise<string>((resolve) => {
            item.getAsString(resolve);
          });
          
          if (text && !hasHandledContent) {
            // If content is empty and it's a URL, put it in URL field
            if (!content && !url && text.match(/^https?:\/\//)) {
              setUrl(text);
            }
            // Otherwise append to content
            else {
              setContent(prev => prev ? `${prev}\n\n${text}` : text);
              // Auto-generate title from first line if empty
              if (!title) {
                const firstLine = text.split('\n')[0].substring(0, 100);
                setTitle(firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine);
              }
            }
            hasHandledContent = true;
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, type, content, url, title]);

  // Auto-detect URLs (YouTube and regular websites)
  useEffect(() => {
    if (url && url.match(/^https?:\/\//)) {
      if (isYouTubeUrl(url)) {
        // Handle YouTube URLs
        if (!type) {
          setType('video');
        }
        const info = getYouTubeVideoInfo(url);
        setYoutubeInfo(info);
        setWebsiteMetadata(null); // Clear website metadata for YouTube
        
        // Check for duplicates immediately
        checkForDuplicateYouTubeVideo(url, null)
          .then((duplicate) => {
            if (duplicate) {
              setDuplicateWarning(`⚠️ This video is already saved as: "${duplicate.title}"`);
            } else {
              setDuplicateWarning('');
            }
          })
          .catch(() => {
            setDuplicateWarning('');
          });
      } else {
        // Handle regular website URLs
        if (!type) {
          setType('link');
        }
        setYoutubeInfo(null); // Clear YouTube info for regular websites
        setDuplicateWarning('');
        
        // Scrape website metadata with a small delay to avoid too many requests
        const timeoutId = setTimeout(() => {
          scrapeWebsiteMetadata(url);
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    } else {
      // Clear all metadata if URL is empty or invalid
      setYoutubeInfo(null);
      setWebsiteMetadata(null);
      setDuplicateWarning('');
    }
  }, [url, checkForDuplicateYouTubeVideo, scrapeWebsiteMetadata]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUrl('');
    setType('');
    setCategory('');
    setTags('');
    setMessage('');
    setYoutubeInfo(null);
    setYoutubeMetadata(null);
    setWebsiteMetadata(null);
    setIsLoadingMetadata(false);
    setDuplicateWarning('');
    setEnableTranscription(false);
    setManualTranscript('');
    setShowTranscriptInput(false);
    setFiles([]);
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // File type detection
  const getFileType = (file: File): 'image' | 'video' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setMessage(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      const fileType = getFileType(file);
      const previewUrl = fileType === 'image' || fileType === 'video' 
        ? URL.createObjectURL(file) 
        : '';

      newFiles.push({
        file,
        url: previewUrl,
        type: fileType
      });
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      // Revoke object URL to prevent memory leaks
      if (newFiles[index].url) {
        URL.revokeObjectURL(newFiles[index].url);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Compress image if needed
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calculate new dimensions (max 1920px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 1920;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload files to Supabase Storage
  const uploadFiles = async (memoryId: string): Promise<string[]> => {
    console.log('SUPABASE AUTH');
    console.log('ID:', user?.id);
    console.log('User object:', user);
    console.log('Files to upload:', files.length);
    
    // Get fresh session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Fresh session:', session);
    console.log('Session user ID:', session?.user?.id);
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error');
    }
    
    const userId = session?.user?.id || user?.id;
    
    if (!userId || files.length === 0) {
      console.error('No user ID available for upload');
      return [];
    }
    
    const uploadedPaths: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const filePreview = files[i];
      let fileToUpload = filePreview.file;
      
      // Compress images if needed
      if (filePreview.type === 'image' && fileToUpload.size > 2 * 1024 * 1024) {
        setMessage(`Compressing ${fileToUpload.name}...`);
        fileToUpload = await compressImage(fileToUpload);
      }
      
      const fileName = `${Date.now()}_${fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${userId}/${memoryId}/${fileName}`;
      
      setUploadProgress(((i + 1) / files.length) * 100);
      
      // Use API route to upload with service role
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('memoryId', memoryId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }
      
      const { path: uploadedPath } = result;
      
      uploadedPaths.push(uploadedPath);
    }
    
    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Prevent saving if there's a duplicate warning
    if (duplicateWarning) {
      setMessage(duplicateWarning);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Prepare file metadata
      const fileMetadata = files.length > 0 ? {
        files: files.map(f => ({
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
          fileType: f.type
        }))
      } : {};

      const memoryData = {
        title: title.trim(),
        content: content.trim() || undefined,
        url: url.trim() || undefined,
        type,
        category: category || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        metadata: {
          ...fileMetadata,
          ...(youtubeInfo ? {
            youtube: {
              videoId: youtubeInfo.videoId,
              thumbnailUrl: youtubeInfo.thumbnailUrl,
              embedUrl: youtubeInfo.embedUrl,
              enableTranscription,
              ...(manualTranscript ? {
                transcript: manualTranscript,
                transcriptSource: 'manual',
                hasTranscript: true
              } : {}),
              ...youtubeMetadata ? {
                title: youtubeMetadata.title,
                channelTitle: youtubeMetadata.channelTitle,
                description: youtubeMetadata.description,
                publishedAt: youtubeMetadata.publishedAt,
              } : {}
            }
          } : {}),
          ...(websiteMetadata ? {
            website: {
              title: websiteMetadata.title,
              description: websiteMetadata.description,
              image: websiteMetadata.image,
              siteName: websiteMetadata.siteName,
              scrapedAt: new Date().toISOString()
            }
          } : {})
        }
      };

      console.log('🔍 Attempting to create memory with data:', memoryData);
      const result = await createMemory(memoryData as any);
      
      if (!result) {
        setMessage('⚠️ Memory saved but processing unavailable. Please check your settings.');
        setTimeout(() => {
          handleClose();
        }, 2000);
        return;
      }
      
      // Upload files if any
      if (files.length > 0 && result.id) {
        setMessage('Uploading files...');
        try {
          const uploadedPaths = await uploadFiles(result.id);
          
          // Update memory with file paths
          if (uploadedPaths.length > 0) {
            // Get signed URLs from API
            const { data: { session } } = await supabase.auth.getSession();
            const urlPromises = uploadedPaths.map(async (path) => {
              const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`
                }
              });
              const data = await response.json();
              return data.url;
            });
            
            const signedUrls = await Promise.all(urlPromises);
            
            // Update the memory with file paths
            await supabase
              .from('memories')
              .update({
                file_path: uploadedPaths[0], // Primary file
                metadata: {
                  ...result.metadata,
                  files: files.map((f, i) => ({
                    name: f.file.name,
                    size: f.file.size,
                    type: f.file.type,
                    fileType: f.type,
                    path: uploadedPaths[i],
                    url: signedUrls[i]
                  }))
                }
              })
              .eq('id', result.id);
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setMessage('⚠️ Memory saved but some files failed to upload');
        }
      }
      
      // Si hay transcript manual, procesarlo con AI para generar resumen
      if (manualTranscript && result.id) {
        setMessage('Processing transcript...');
        
        try {
          const response = await fetch('/api/process-manual-transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              memoryId: result.id,
              transcript: manualTranscript,
              videoTitle: title
            })
          });

          if (response.ok) {
            setMessage('✅ Memory saved with transcript and AI summary!');
          } else {
            setMessage('⚠️ Memory saved but transcript processing failed');
          }
        } catch (error) {
          console.error('Error processing manual transcript:', error);
          setMessage('⚠️ Memory saved but transcript processing failed');
        }
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setMessage('Memory saved successfully!');
        setTimeout(() => {
          handleClose();
          // No refresh needed - useMemories handles state updates automatically
        }, 1000);
      }
    } catch (error) {
      console.error('Error creating memory:', error);
      const err = error as Error;
      if (err.name === 'DuplicateError' || err.message.includes('already saved as:')) {
        setMessage(err.message); // Show the duplicate message as warning
      } else {
        setMessage('Error saving memory. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentType = MEMORY_TYPES.find(t => t.value === type);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content new-memory-modal">
        <div className="modal-header">
          <h2>New Memory</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="memory-form">
          {/* Type Selection */}
          <div className="form-group">
            <label>Type {!type && <span className="required-indicator">*</span>}</label>
            <div className="type-grid">
              {MEMORY_TYPES.map((memoryType) => (
                <button
                  key={memoryType.value}
                  type="button"
                  className={`type-button ${type === memoryType.value ? 'active' : ''}`}
                  onClick={() => setType(memoryType.value)}
                >
                  {memoryType.label}
                </button>
              ))}
            </div>
          </div>

          {/* URL field - always visible except for Note type */}
          {type !== 'note' && (
            <>
              <div className="form-group">
                <label htmlFor="url">URL (optional)</label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Add a URL (YouTube, website, etc.)"
                />
              </div>

              {/* File Upload Area - only for document type */}
              {type === 'document' && (
              <div className="form-group">
                <label>Files (optional)</label>
                <div
                  className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                  />
                  
                  <div className="drop-zone-content">
                    <span className="drop-icon">📁</span>
                    <p>Drop files here or click to browse</p>
                    <p className="drop-hint">Supports images, videos, PDFs, documents (Max 50MB)</p>
                  </div>
                </div>
                
                {/* File Preview List */}
                {files.length > 0 && (
                  <div className="file-preview-list">
                    {files.map((filePreview, index) => (
                      <div key={index} className="file-preview-item">
                        {filePreview.type === 'image' && (
                          <img src={filePreview.url} alt={filePreview.file.name} className="file-preview-image" />
                        )}
                        {filePreview.type === 'video' && (
                          <video src={filePreview.url} className="file-preview-video" controls />
                        )}
                        {(filePreview.type === 'document' || filePreview.type === 'other') && (
                          <div className="file-preview-icon">
                            {filePreview.type === 'document' ? '📄' : '📎'}
                          </div>
                        )}
                        <div className="file-preview-info">
                          <span className="file-name">{filePreview.file.name}</span>
                          <span className="file-size">{(filePreview.file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                          type="button"
                          className="file-remove-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
              )}
            </>
          )}

          {/* Duplicate Warning Accordion */}
          {duplicateWarning && (
            <div className="duplicate-warning-accordion">
              <div className="duplicate-warning-content">
                <div className="duplicate-warning-icon">⚠️</div>
                <div className="duplicate-warning-text">
                  {duplicateWarning.replace('⚠️ ', '')}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your memory a title..."
              required
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">
              {type === 'note' ? 'Content' : 'Notes (optional)'}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={currentType?.placeholder}
              rows={type === 'note' ? 6 : 4}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="javascript, tutorial, important (comma separated)"
            />
          </div>

          {/* Transcription Toggle for YouTube videos */}
          {(type === 'video' || type === 'link') && url && isYouTubeUrl(url) && (
            <>
            <div className="form-group">
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🎯 Auto-transcribe video
                  <span className="text-sm text-gray-500">(Free from YouTube, $0.90/hour via AssemblyAI)</span>
                </span>
                <input
                  type="checkbox"
                  checked={enableTranscription}
                  onChange={(e) => {
                    setEnableTranscription(e.target.checked);
                    if (e.target.checked) setShowTranscriptInput(false);
                  }}
                  className="toggle-switch"
                  disabled={showTranscriptInput}
                />
              </label>
              {enableTranscription && (
                <p className="text-sm text-green-600 mt-1">
                  ✨ Will automatically extract transcript and generate AI summary with tools/concepts mentioned
                </p>
              )}
            </div>

            {/* Manual Transcript Option */}
            <div className="form-group">
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  📝 Add transcript manually
                </span>
                <input
                  type="checkbox"
                  checked={showTranscriptInput}
                  onChange={(e) => {
                    setShowTranscriptInput(e.target.checked);
                    if (e.target.checked) setEnableTranscription(false);
                  }}
                  className="toggle-switch"
                  disabled={enableTranscription}
                />
              </label>
              {showTranscriptInput && (
                <div className="mt-3">
                  <textarea
                    placeholder="Paste the video transcript here..."
                    value={manualTranscript}
                    onChange={(e) => setManualTranscript(e.target.value)}
                    className="form-input"
                    rows={6}
                    style={{ minHeight: '150px' }}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    💡 Tip: You can copy transcripts from YouTube's transcript feature or other sources
                  </p>
                </div>
              )}
            </div>
            </>
          )}

          {/* YouTube Preview */}
          {(type === 'video' || type === 'link') && url && isYouTubeUrl(url) && (
            <YouTubePreview 
                url={url} 
                onVideoInfoExtracted={(info, metadata) => {
                setYoutubeInfo(info);
                if (metadata) {
                  setYoutubeMetadata(metadata);
                  
                  // Auto-fill form fields if they're empty
                  if (!title) {
                    setTitle(metadata.title);
                  }
                  
                  // Fill content with description if available, otherwise basic info
                  if (!content) {
                    if (metadata.description) {
                      setContent(cleanYouTubeDescription(metadata.description));
                    } else {
                      setContent(`YouTube video by ${metadata.channelTitle}\n\nTo get video description automatically, YouTube Data API v3 key is required.`);
                    }
                  }
                  
                  // Generate basic auto-tags
                  if (!tags) {
                    const autoTags = generateAutoTags(metadata);
                    setTags(autoTags.join(', '));
                  }
                  
                  if (!category) {
                    setCategory('Entertainment'); // Default category for YouTube videos
                  }
                }
              }}
            />
          )}

          {/* Website Preview */}
          {type === 'link' && url && !isYouTubeUrl(url) && url.match(/^https?:\/\//) && (
            <div className="website-preview">
              {isLoadingMetadata ? (
                <div className="preview-loading">
                  <span className="loading-icon">🌐</span>
                  <span className="loading-text">Loading website information...</span>
                </div>
              ) : websiteMetadata ? (
                <div className="preview-card">
                  <div className="preview-header">
                    <span className="preview-icon">🌐</span>
                    <span className="preview-label">Website Preview</span>
                  </div>
                  
                  {/* Large Website Image - Like YouTube Thumbnail */}
                  {websiteMetadata.image && (
                    <div className="website-thumbnail-container" style={{
                      marginTop: '1rem',
                      marginBottom: '1rem',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)'
                    }}>
                      <img 
                        src={websiteMetadata.image} 
                        alt={websiteMetadata.title}
                        className="website-thumbnail"
                        style={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: '300px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="preview-content">
                    <div className="preview-main">
                      <div className="preview-header-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div className="logo-container" style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border)'
                        }}>
                          {websiteMetadata.logo ? (
                            <img 
                              src={websiteMetadata.logo} 
                              alt={websiteMetadata.siteName || 'Logo'}
                              className="preview-logo"
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<span style="font-size: 24px">🌐</span>';
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: '24px' }}>🌐</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 className="preview-title" style={{ margin: 0, marginBottom: '0.25rem' }}>
                            {websiteMetadata.title}
                          </h3>
                          <p className="preview-url" style={{ margin: 0 }}>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="url-domain"
                              style={{ 
                                color: 'var(--text-secondary)', 
                                textDecoration: 'none',
                                fontSize: '0.875rem'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {websiteMetadata.siteName || new URL(url).hostname}
                            </a>
                          </p>
                          
                          {websiteMetadata.description && (
                            <p className="preview-description" style={{
                              marginTop: '0.5rem',
                              fontSize: '0.875rem',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.4'
                            }}>
                              {websiteMetadata.description.substring(0, 200)}
                              {websiteMetadata.description.length > 200 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {websiteMetadata.autoTags && websiteMetadata.autoTags.length > 0 && (
                        <div className="preview-tags" style={{ marginTop: '1rem' }}>
                          <strong style={{ fontSize: '0.875rem' }}>Auto-detected tags:</strong>
                          <div className="auto-tags" style={{ marginTop: '0.5rem' }}>
                            {websiteMetadata.autoTags.slice(0, 5).map((tag, index) => (
                              <span key={index} className="auto-tag" style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                margin: '0.25rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {message && (
            <div className={`message ${
              message.includes('Error saving') ? 'error' : 
              message.includes('already saved') || message.includes('⚠️') ? 'warning' : 
              'success'
            }`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={handleClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim() || !!duplicateWarning || !type} className="save-button">
              {loading ? 'Saving...' : 
               duplicateWarning ? 'Cannot Save - Duplicate' : 
               !type ? 'Select Type to Save' :
               'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}