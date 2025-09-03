import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

interface SampleNoteProps {
  settings?: Record<string, any>;
  widgetName?: string;
  widgetInstanceId?: string;
  onSettingsUpdate?: (newSettings: Record<string, any>) => void;
}

const SampleNote: React.FC<SampleNoteProps> = ({ settings, widgetName, widgetInstanceId, onSettingsUpdate }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  const { toast } = useToast();

  const maxNotes = settings?.maxNotes || 5;
  const fontSize = settings?.fontSize || 'text-sm';

  useEffect(() => {
    // Load notes from settings
    if (settings?.notes) {
      const loadedNotes = settings.notes.map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp)
      }));
      setNotes(loadedNotes);
      if (loadedNotes.length > 0) {
        setActiveNoteId(loadedNotes[0].id);
        setNoteContent(loadedNotes[0].content);
      }
    } else {
      // Create initial note
      const initialNote: Note = {
        id: '1',
        content: 'Welcome to your personal notepad!\n\nUse this space to jot down quick notes, reminders, or thoughts.',
        timestamp: new Date()
      };
      setNotes([initialNote]);
      setActiveNoteId(initialNote.id);
      setNoteContent(initialNote.content);
    }
  }, [settings]);

  useEffect(() => {
    if (autoSave && activeNoteId) {
      const saveTimer = setTimeout(saveCurrentNote, 2000);
      return () => clearTimeout(saveTimer);
    }
  }, [noteContent, autoSave, activeNoteId]);

  const saveCurrentNote = () => {
    if (!activeNoteId) return;

    const updatedNotes = notes.map(note =>
      note.id === activeNoteId
        ? { ...note, content: noteContent, timestamp: new Date() }
        : note
    );
    
    setNotes(updatedNotes);
    
    if (onSettingsUpdate) {
      onSettingsUpdate({
        ...settings,
        notes: updatedNotes.map(note => ({
          ...note,
          timestamp: note.timestamp.toISOString()
        }))
      });
    }

    if (autoSave) {
      toast({
        title: "Note Saved",
        description: "Your note has been automatically saved.",
      });
    }
  };

  const createNewNote = () => {
    if (notes.length >= maxNotes) {
      toast({
        title: "Note Limit Reached",
        description: `Maximum of ${maxNotes} notes allowed.`,
        variant: "destructive"
      });
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      timestamp: new Date()
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setActiveNoteId(newNote.id);
    setNoteContent('');
  };

  const deleteNote = (noteId: string) => {
    if (notes.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one note must remain.",
        variant: "destructive"
      });
      return;
    }

    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    
    if (activeNoteId === noteId) {
      setActiveNoteId(updatedNotes[0].id);
      setNoteContent(updatedNotes[0].content);
    }

    if (onSettingsUpdate) {
      onSettingsUpdate({
        ...settings,
        notes: updatedNotes.map(note => ({
          ...note,
          timestamp: note.timestamp.toISOString()
        }))
      });
    }
  };

  const selectNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setActiveNoteId(noteId);
      setNoteContent(note.content);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className="h-full flex flex-col bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card p-3">
        <div className="flex items-center justify-between">
          <span className="text-primary font-mono text-sm uppercase tracking-wider crt-glow">
            📝 {widgetName || 'NOTES TERMINAL'}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={createNewNote}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={notes.length >= maxNotes}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveCurrentNote}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Note Tabs */}
      {notes.length > 1 && (
        <div className="flex-shrink-0 border-b border-border bg-background/50 p-2">
          <div className="flex gap-1 overflow-x-auto">
            {notes.map(note => (
              <button
                key={note.id}
                onClick={() => selectNote(note.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeNoteId === note.id
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-background hover:bg-accent/10 text-muted-foreground border border-border'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-16">
                  {note.content.slice(0, 10) || 'Untitled'}
                </span>
                {notes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Note Area */}
      <div className="flex-1 flex flex-col p-4">
        <Textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Start typing your note here..."
          className={`flex-1 resize-none bg-background/50 border-border font-mono ${fontSize} leading-relaxed`}
        />
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 border-t border-border bg-background/30 p-2">
        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
          <span>
            {notes.length}/{maxNotes} notes • {noteContent.length} characters
          </span>
          {activeNoteId && (
            <span>
              Last saved: {formatTimestamp(notes.find(n => n.id === activeNoteId)?.timestamp || new Date())}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SampleNote;