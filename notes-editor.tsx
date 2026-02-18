import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from 'lucide-react'

interface NotesEditorProps {
  content: string
  onChange: (html: string) => void
}

export function NotesEditor({ content, onChange }: NotesEditorProps): React.JSX.Element {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) {
    return <div className="h-40 rounded-lg bg-surface-1 animate-pulse" />
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden bg-surface-0">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-surface-1/50">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="w-px h-4 bg-border/40 mx-1" />
        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="tiptap-editor prose prose-sm dark:prose-invert max-w-none px-4 py-3 min-h-[120px] focus-within:outline-none"
      />
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  title,
  children
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-1'
      }`}
    >
      {children}
    </button>
  )
}
