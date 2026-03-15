"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, FileText } from "lucide-react";
import { apiFetch } from "@/utils/api";
import type { Notice, NoticeAttachment } from "@/types/notice";
import { Navigation } from "@/components/main/Navigation";

const CATEGORIES = ["일반", "공지", "긴급"] as const;

export default function NoticeWritePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("일반");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setAuthToken(token);
    setAuthChecked(true);
  }, [router]);

  const MAX_FILE_SIZE = 100 * 1024; // 0.1MB (100KB)
  const MAX_FILES = 5;
  const ALLOWED_TYPES = new Set([
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const all = Array.from(e.target.files || []);
    const warnings: string[] = [];

    // 개수 제한
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      alert(`파일은 최대 ${MAX_FILES}개까지 첨부 가능합니다.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const valid = all.filter((f) => {
      if (!ALLOWED_TYPES.has(f.type)) {
        warnings.push(`${f.name}: 허용되지 않는 형식`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        warnings.push(`${f.name}: 100KB 초과`);
        return false;
      }
      return true;
    }).slice(0, remaining);

    if (all.length > remaining) {
      warnings.push(`최대 ${MAX_FILES}개 제한으로 ${all.length - remaining}개 제외`);
    }
    if (warnings.length > 0) alert(warnings.join("\n"));
    setFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !authToken || submitting) return;
    setSubmitting(true);

    try {
      // 1. 글 생성
      const notice = await apiFetch<Notice>("/notices", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category }),
      });

      // 2. 파일 업로드 (있는 경우)
      const failedFiles: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app"}/notices/${notice.id}/upload`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${authToken}` },
              body: formData,
            },
          );
          if (!res.ok) failedFiles.push(file.name);
        } catch {
          failedFiles.push(file.name);
        }
      }

      if (failedFiles.length > 0) {
        alert(`글은 등록되었지만 ${failedFiles.length}개 파일 업로드 실패: ${failedFiles.join(", ")}`);
      } else {
        alert("글이 등록되었습니다. 관리자 승인 후 게시됩니다.");
      }
      router.push("/notices");
    } catch (err) {
      alert(err instanceof Error ? err.message : "글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) return null;

  return (
    <>
    <Navigation />
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px" }}>
      <div className="sacred-rail" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 72px)", maxWidth: "800px" }}>

        {/* 뒤로가기 */}
        <button
          type="button"
          onClick={() => router.push("/notices")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
            color: "#9C9891", background: "none", border: "none",
            cursor: "pointer", marginBottom: "24px", padding: 0,
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          목록으로
        </button>

        <h1 style={{
          fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(22px, 4vw, 28px)",
          fontWeight: 900, color: "#0B2040", marginBottom: "32px",
        }}>
          글쓰기
        </h1>

        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #E8E5DF", padding: "clamp(24px, 4vw, 36px)",
        }}>
          {/* 카테고리 선택 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
            }}>
              카테고리
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: "7px 16px", borderRadius: "8px",
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500,
                    backgroundColor: category === cat ? "#0B2040" : "transparent",
                    color: category === cat ? "#FFFFFF" : "#52504B",
                    border: category === cat ? "none" : "1.5px solid #E8E5DF",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
            }}>
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={200}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "8px",
                border: "1.5px solid #E8E5DF", outline: "none",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
                color: "#100F0F", backgroundColor: "#FAFAF8",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#0B2040"}
              onBlur={e => e.currentTarget.style.borderColor = "#E8E5DF"}
            />
          </div>

          {/* 본문 */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
            }}>
              내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={12}
              style={{
                width: "100%", padding: "14px", borderRadius: "8px",
                border: "1.5px solid #E8E5DF", outline: "none",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
                color: "#100F0F", backgroundColor: "#FAFAF8",
                resize: "vertical", minHeight: "200px", lineHeight: 1.7,
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#0B2040"}
              onBlur={e => e.currentTarget.style.borderColor = "#E8E5DF"}
            />
          </div>

          {/* 파일 첨부 */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
            }}>
              첨부파일
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileAdd}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 16px", borderRadius: "8px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                color: "#52504B", backgroundColor: "transparent",
                border: "1.5px dashed #D0CDC7", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0B2040"; e.currentTarget.style.color = "#0B2040"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#D0CDC7"; e.currentTarget.style.color = "#52504B"; }}
            >
              <Upload size={14} strokeWidth={2} />
              파일 선택 (최대 100KB, 5개)
            </button>
            {files.length > 0 && (
              <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {files.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 12px", borderRadius: "6px",
                      backgroundColor: "#FAFAF8", border: "1px solid #F0EFE9",
                    }}
                  >
                    <FileText size={14} color="#52504B" strokeWidth={2} />
                    <span style={{ flex: 1, fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#100F0F" }}>
                      {file.name}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(i)}
                      style={{
                        width: "20px", height: "20px", borderRadius: "4px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", backgroundColor: "transparent",
                        color: "#9C9891", cursor: "pointer",
                      }}
                    >
                      <X size={13} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <div style={{
            padding: "12px 16px", borderRadius: "8px",
            backgroundColor: "rgba(201,169,110,0.06)",
            border: "1px solid rgba(201,169,110,0.15)",
            marginBottom: "24px",
          }}>
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              color: "#C9A96E", margin: 0, lineHeight: 1.6,
            }}>
              작성된 글은 관리자 승인 후 게시됩니다.
            </p>
          </div>

          {/* 제출 버튼 */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => router.push("/notices")}
              style={{
                padding: "12px 24px", borderRadius: "8px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500,
                backgroundColor: "transparent", color: "#52504B",
                border: "1.5px solid #E8E5DF", cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || submitting}
              style={{
                padding: "12px 28px", borderRadius: "8px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                backgroundColor: title.trim() && content.trim() ? "#0B2040" : "#D0CDC7",
                color: "#FFFFFF", border: "none",
                cursor: title.trim() && content.trim() ? "pointer" : "default",
                transition: "background 0.15s",
              }}
            >
              {submitting ? "등록 중..." : "작성 완료"}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
