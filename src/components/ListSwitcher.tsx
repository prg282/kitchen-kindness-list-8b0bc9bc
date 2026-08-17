import { useState } from 'react';
import { Plus, Check, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GroceryListRecord } from '@/hooks/useGroceryLists';

interface Props {
  lists: GroceryListRecord[];
  activeListId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function ListSwitcher({ lists, activeListId, onSelect, onCreate, onRename, onDelete }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeList = lists.find((l) => l.id === activeListId) ?? null;

  const submitNew = () => {
    const name = newName.trim();
    if (name) onCreate(name);
    setNewName('');
    setAdding(false);
  };

  const submitRename = () => {
    if (renamingId && renameValue.trim()) onRename(renamingId, renameValue);
    setRenamingId(null);
    setRenameValue('');
  };

  if (lists.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-3 min-w-0">
      {renamingId && renamingId === activeListId ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            autoFocus
            value={renameValue}
            maxLength={60}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setRenamingId(null);
            }}
            className="h-9"
          />
          <Button size="sm" onClick={submitRename}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : adding ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            autoFocus
            value={newName}
            maxLength={60}
            placeholder="New list name (e.g. Braai)"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNew();
              if (e.key === 'Escape') setAdding(false);
            }}
            className="h-9"
          />
          <Button size="sm" onClick={submitNew}>
            <Check className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => onSelect(list.id)}
                className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all ${
                  list.id === activeListId
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {list.name}
              </button>
            ))}
            <button
              onClick={() => setAdding(true)}
              title="New list"
              className="px-2.5 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeList && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground shrink-0">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(activeList.name);
                    setRenamingId(activeList.id);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Rename “{activeList.name}”
                </DropdownMenuItem>
                {!activeList.is_default && lists.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(activeList.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete list
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}
    </div>
  );
}

export default ListSwitcher;
