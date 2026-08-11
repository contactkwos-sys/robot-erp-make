/**
 * Compatibility re-export.
 * Prefer `@/lib/storage/uploads` — this module kept so main-branch imports keep working.
 */
export { saveUploadBytes as saveUpload, saveUpload as saveUploadFile } from "@/lib/storage/uploads";
