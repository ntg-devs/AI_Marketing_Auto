"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Highlight } from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { useCallback, useState } from "react";
import EditorToolbar from "./EditorToolbar";
import ImageUploadDialog from "./ImageUploadDialog";

interface TipTapEditorProps {
  content: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing your content...",
  className = "",
}: TipTapEditorProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content outline-none",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter((f) => f.type.startsWith("image/"));
          if (images.length > 0) {
            event.preventDefault();
            images.forEach((image) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const url = e.target?.result as string;
                if (url) {
                  editor?.chain().focus().setImage({ src: url }).run();
                }
              };
              reader.readAsDataURL(image);
            });
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const url = e.target?.result as string;
                  if (url) {
                    editor?.chain().focus().setImage({ src: url }).run();
                  }
                };
                reader.readAsDataURL(file);
              }
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const handleInsertImage = useCallback(
    (src: string, alt?: string) => {
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src, alt: alt || "" })
          .run();
      }
      setShowImageDialog(false);
    },
    [editor],
  );

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onImageClick={() => setShowImageDialog(true)}
        onLinkClick={handleSetLink}
      />


      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto scrollbar-custom">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Image Upload Dialog */}
      <ImageUploadDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={handleInsertImage}
      />
    </div>
  );
}

