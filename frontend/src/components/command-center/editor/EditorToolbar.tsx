'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  ImagePlus,
  Highlighter,
  Minus,
  RemoveFormatting,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

interface EditorToolbarProps {
  editor: Editor;
  onImageClick: () => void;
  onLinkClick: () => void;
}

interface ToolbarButton {
  icon: typeof Bold;
  label: string;
  action: () => void;
  isActive?: () => boolean;
  disabled?: boolean;
}

export default function EditorToolbar({
  editor,
  onImageClick,
  onLinkClick,
}: EditorToolbarProps) {
  const groups: (ToolbarButton | 'divider')[][] = [
    // Undo/Redo
    [
      {
        icon: Undo2,
        label: 'Undo',
        action: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
      },
      {
        icon: Redo2,
        label: 'Redo',
        action: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
      },
    ],
    // Text formatting
    [
      {
        icon: Bold,
        label: 'Bold (⌘B)',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold'),
      },
      {
        icon: Italic,
        label: 'Italic (⌘I)',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic'),
      },
      {
        icon: Underline,
        label: 'Underline (⌘U)',
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive('underline'),
      },
      {
        icon: Strikethrough,
        label: 'Strikethrough',
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive('strike'),
      },
      {
        icon: Highlighter,
        label: 'Highlight',
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: () => editor.isActive('highlight'),
      },
    ],
    // Headings
    [
      {
        icon: Heading1,
        label: 'Heading 1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive('heading', { level: 1 }),
      },
      {
        icon: Heading2,
        label: 'Heading 2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive('heading', { level: 2 }),
      },
      {
        icon: Heading3,
        label: 'Heading 3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive('heading', { level: 3 }),
      },
    ],
    // Lists & Block
    [
      {
        icon: List,
        label: 'Bullet List',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList'),
      },
      {
        icon: ListOrdered,
        label: 'Ordered List',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList'),
      },
      {
        icon: Quote,
        label: 'Blockquote',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive('blockquote'),
      },
      {
        icon: Code2,
        label: 'Code Block',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive('codeBlock'),
      },
      {
        icon: Minus,
        label: 'Horizontal Rule',
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    // Alignment
    [
      {
        icon: AlignLeft,
        label: 'Align Left',
        action: () => editor.chain().focus().setTextAlign('left').run(),
        isActive: () => editor.isActive({ textAlign: 'left' }),
      },
      {
        icon: AlignCenter,
        label: 'Align Center',
        action: () => editor.chain().focus().setTextAlign('center').run(),
        isActive: () => editor.isActive({ textAlign: 'center' }),
      },
      {
        icon: AlignRight,
        label: 'Align Right',
        action: () => editor.chain().focus().setTextAlign('right').run(),
        isActive: () => editor.isActive({ textAlign: 'right' }),
      },
    ],
    // Insert
    [
      {
        icon: Link2,
        label: 'Insert Link',
        action: onLinkClick,
        isActive: () => editor.isActive('link'),
      },
      {
        icon: ImagePlus,
        label: 'Insert Image',
        action: onImageClick,
      },
    ],
    // Clear
    [
      {
        icon: RemoveFormatting,
        label: 'Clear Formatting',
        action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      },
    ],
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-default flex-wrap bg-surface-1/60">
      {groups.map((group, gIdx) => (
        <div key={gIdx} className="flex items-center gap-0.5">
          {gIdx > 0 && (
            <div className="w-px h-5 bg-border mx-1" />
          )}
          {group.map((item) => {
            if (item === 'divider') {
              return <div key="div" className="w-px h-5 bg-border" />;
            }
            const btn = item as ToolbarButton;
            const active = btn.isActive?.() ?? false;
            return (
              <Tooltip key={btn.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={btn.action}
                    disabled={btn.disabled}
                    className={`h-7 w-7 flex items-center justify-center rounded-md transition-all text-xs disabled:opacity-30 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-primary/20 text-primary shadow-sm shadow-primary/10'
                        : 'text-dim hover:text-heading hover:bg-surface-hover'
                    }`}
                  >
                    <btn.icon className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">
                  {btn.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
