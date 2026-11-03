"use client";

import { useEffect, useRef, useState } from "react";
import type { EditorView } from "codemirror";
import { practiceTables } from "@/lib/sql/data";

export function SqlEditor({ value, onChange, onRun }: { value: string; onChange: (value: string) => void; onRun: () => void }) {
  const parent = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null);
  const current = useRef({ value, onChange, onRun });
  current.current = { value, onChange, onRun };
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("codemirror"), import("@codemirror/lang-sql")]).then(([cm, sql]) => {
      if (cancelled || !parent.current) return;
      const editor = new cm.EditorView({
        parent: parent.current,
        doc: current.current.value,
        extensions: [cm.basicSetup, sql.sql({ dialect: sql.PostgreSQL, schema: Object.fromEntries(practiceTables.map(t => [t.name, t.columns.map(c => c.name)])) }),
          cm.EditorView.lineWrapping,
          cm.EditorView.contentAttributes.of({ "aria-label": "SQL query editor", spellcheck: "false" }),
          cm.EditorView.updateListener.of(update => { if (update.docChanged) current.current.onChange(update.state.doc.toString()); }),
          cm.EditorView.domEventHandlers({ keydown: event => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); current.current.onRun(); return true; } return false; } }),
          cm.EditorView.theme({ "&": { color: "var(--ink)", backgroundColor: "transparent", fontSize: ".875rem" }, ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.7", overflow: "auto", maxHeight: "440px", minHeight: "260px" }, ".cm-content": { padding: "16px 0" }, ".cm-gutters": { backgroundColor: "transparent", borderRightColor: "var(--line)", color: "var(--muted)" }, ".cm-activeLine,.cm-activeLineGutter": { backgroundColor: "#dce3ca55" }, "&.cm-focused": { outline: "2px solid #7151b1", outlineOffset: "-2px" } }),
        ],
      });
      view.current = editor; setEnhanced(true);
    }).catch(() => { /* Plain textarea remains usable if enhancement fails. */ });
    return () => { cancelled = true; view.current?.destroy(); view.current = null; };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value) editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);
  return <div className="sql-editor"><div ref={parent} />{!enhanced && <textarea aria-label="SQL query editor" value={value} onChange={e => onChange(e.target.value)} spellCheck={false} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun(); } }} />}</div>;
}
