"use client";

import { useEffect, useState } from "react";
import type { DocumentRecord } from "@/types";
import { apiGet, apiSend } from "@/lib/client-api";
import { formatDate } from "@/lib/utils";
import {
  Input,
  LoadingState,
  PageHeader,
  Panel,
  Select,
} from "@/components/ui/primitives";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [entityType, setEntityType] = useState("general");
  const [message, setMessage] = useState<string | null>(null);

  const load = () =>
    apiGet<DocumentRecord[]>("/api/documents")
      .then(setDocs)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader title="Documents" subtitle="Datasheets, manuals, screenshots, and supplier quotations." />
      <Panel className="mb-4 grid gap-3 md:grid-cols-4">
        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="general">General</option>
          <option value="project">Project</option>
          <option value="component">Component</option>
          <option value="product">Product</option>
          <option value="purchase">Purchase</option>
        </Select>
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const body = new FormData();
            body.append("file", file);
            body.append("title", title || file.name);
            body.append("entity_type", entityType);
            await apiSend("/api/documents", "POST", body);
            setMessage("Document uploaded.");
            setTitle("");
            load();
          }}
        />
        <div className="text-sm text-[var(--fg-muted)] flex items-center">{message}</div>
      </Panel>
      {loading ? (
        <LoadingState />
      ) : (
        <div className="table-wrap panel">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Entity</th>
                <th>Size</th>
                <th>Date</th>
                <th>Open</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.file_type}</td>
                  <td>{d.entity_type}</td>
                  <td>{Math.round(d.file_size / 1024)} KB</td>
                  <td>{formatDate(d.created_at)}</td>
                  <td>
                    <a className="underline" href={d.file_path} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
