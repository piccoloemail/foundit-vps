'use client';

import { useState, useEffect } from 'react';
import { useMemories } from '@/hooks/useMemories';
import { Memory } from '@/lib/supabase';

interface EditMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
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

export default function EditMemoryModal({ isOpen, onClose, memory }: EditMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'document' | 'link' | 'video' | 'note'>('document');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateMemory, deleteMemory } = useMemories();

  // Populate form when memory changes
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setContent(memory.content || '');
      setUrl(memory.url || '');
      // Map old types to new types
      const typeMapping: Record<string, 'document' | 'link' | 'video' | 'note'> = {
        'link': 'link',
        'text': 'note', 
        'image': 'document',
        'video': 'video',
        'document': 'document',
        'note': 'note'
      };
      setType(typeMapping[memory.type] || 'document');
      setCategory(memory.category || '');
      setTags(memory.tags ? memory.tags.join(', ') : '');
    }
  }, [memory]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUrl('');
    setType('document');
    setCategory('');
    setTags('');
    setMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memory || !title.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const updates = {
        title: title.trim(),
        content: content.trim() || null,
        url: url.trim() || null,
        type,
        category: category || null,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
      };

      await updateMemory(memory.id, updates);
      setMessage('Memory updated successfully!');
      setTimeout(() => {
        handleClose();
        // Force a small delay to ensure the UI updates
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 1000);
    } catch (error) {
      console.error('Error updating memory:', error);
      setMessage('Error updating memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!memory) return;

    setShowDeleteConfirm(false);
    setLoading(true);
    setMessage('');

    try {
      await deleteMemory(memory.id);
      setMessage('Memory deleted successfully!');
      setTimeout(() => {
        handleClose();
        // Force a small delay to ensure the UI updates
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 1000);
    } catch (error) {
      console.error('Error deleting memory:', error);
      setMessage('Error deleting memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentType = MEMORY_TYPES.find(t => t.value === type);

  if (!isOpen || !memory) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content new-memory-modal">
        <div className="modal-header">
          <h2>Edit Memory</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleUpdate} className="memory-form">
          {/* Type Selection */}
          <div className="form-group">
            <label>Type</label>
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

          {/* URL field for document, website and video types */}
          {(type === 'document' || type === 'link' || type === 'video') && (
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
          )}

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

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleDeleteClick} 
              className="delete-button"
              disabled={loading}
            >
              🗑️ Delete
            </button>
            <div style={{ flex: 1 }}></div>
            <button type="button" onClick={handleClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title.trim()} className="save-button">
              {loading ? 'Updating...' : 'Update Memory'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <div className="delete-confirm-header">
              <div className="delete-icon">⚠️</div>
              <h3>Delete Memory</h3>
            </div>
            <div className="delete-confirm-content">
              <p>Are you sure you want to delete <strong>"{memory?.title}"</strong>?</p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="delete-confirm-actions">
              <button 
                className="delete-cancel-button" 
                onClick={handleDeleteCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-button" 
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Memory'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}