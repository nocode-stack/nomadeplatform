
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from './textarea';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useUsers, User } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MentionTextarea = ({ 
  value, 
  onChange, 
  placeholder,
  className,
  disabled 
}: MentionTextareaProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { data: users = [] } = useUsers();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    // Buscar menciones activas
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const start = cursorPosition - mentionMatch[0].length;
      
      setMentionStart(start);
      setMentionQuery(query);
      
      // Filtrar usuarios
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limitar a 5 sugerencias
      
      setFilteredUsers(filtered);
      setSelectedSuggestionIndex(0);
      setShowSuggestions(filtered.length > 0);
      
      // Calcular posición del dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const lineHeight = 20; // Aproximado
        const lines = textBeforeCursor.split('\n').length;
        const lastLineLength = textBeforeCursor.split('\n').pop()?.length || 0;
        
        setSuggestionPosition({
          top: lines * lineHeight,
          left: Math.min(lastLineLength * 8, textarea.offsetWidth - 200) // 8px aprox por caracter
        });
      }
    } else {
      setShowSuggestions(false);
      setMentionStart(-1);
      setMentionQuery('');
    }
  };

  const insertMention = (user: User) => {
    if (mentionStart === -1) return;
    
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(mentionStart + mentionQuery.length + 1); // +1 para el @
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    
    // Enfocar el textarea y posicionar el cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + user.name.length + 2; // +2 para @ y espacio
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredUsers[selectedSuggestionIndex]) {
          insertMention(filteredUsers[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: suggestionPosition.top + 30,
            left: suggestionPosition.left,
            minWidth: '200px'
          }}
        >
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100",
                index === selectedSuggestionIndex && "bg-blue-50 border-l-2 border-l-blue-500"
              )}
              onClick={() => insertMention(user)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                {user.department && (
                  <p className="text-xs text-gray-500 truncate">
                    {user.department}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && mentionQuery && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No se encontraron usuarios para "{mentionQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
