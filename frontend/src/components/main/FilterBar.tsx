"use client";

import { DIOCESES } from "../../constants/dioceses";

interface FilterBarProps {
    sortBy: string;
    onSortChange: (sort: string) => void;
    totalCount: number;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
    geoLoading?: boolean;
    geoError?: string | null;
    userLocation?: { lat: number; lng: number } | null;
    /** 교구 필터 */
    selectedDiocese: string;
    onDioceseChange: (diocese: string) => void;
}

const selectStyle = (isActive: boolean, activeColor = "#0B6B70", activeBg = "rgba(11,107,112,0.07)", activeBorder = "rgba(11,107,112,0.3)") => ({
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: "12px",
    color: isActive ? activeColor : "#52504B",
    backgroundColor: isActive ? activeBg : "transparent",
    border: "1.5px solid",
    borderColor: isActive ? activeBorder : "#E8E5DF",
    borderRadius: "8px",
    padding: "5px 28px 5px 10px",
    cursor: "pointer" as const,
    outline: "none",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239C9891' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 9px center",
    transition: "all 0.15s ease",
});

export function FilterBar({
    sortBy,
    onSortChange,
    totalCount,
    viewMode,
    onViewModeChange,
    geoLoading,
    geoError,
    userLocation,
    selectedDiocese,
    onDioceseChange,
}: FilterBarProps) {
    const hasDiocese = selectedDiocese !== "";

    return (
        <div
            style={{
                position: "sticky",
                top: "72px",
                zIndex: 40,
                backgroundColor: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderBottom: "1px solid #E8E5DF",
            }}
        >
            <div className="sacred-rail">
                {/* ── 컨트롤 바 ──────────────────────────────────────────── */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "9px",
                        paddingBottom: "9px",
                        flexWrap: "wrap",
                        gap: "6px",
                    }}
                >
                    {/* 좌: 건수 + GPS 상태 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "12px",
                            color: "#9C9891",
                            whiteSpace: "nowrap",
                        }}>
                            {totalCount}건의 행사
                        </span>

                        {sortBy === "distance" && userLocation && !geoLoading && (
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "11px",
                                color: "#0B6B70",
                                backgroundColor: "rgba(11,107,112,0.09)",
                                padding: "2px 9px",
                                borderRadius: "100px",
                                whiteSpace: "nowrap",
                            }}>
                                📍 내 위치 기준
                            </span>
                        )}

                        {geoLoading && (
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "11px",
                                color: "#9C9891",
                            }}>
                                위치 확인 중…
                            </span>
                        )}

                        {geoError && (
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "11px",
                                color: "#C83A1E",
                                whiteSpace: "nowrap",
                            }}>
                                ⚠ {geoError}
                            </span>
                        )}
                    </div>

                    {/* 우: 교구 필터 + 정렬 + 뷰 토글 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                        {/* 교구 select */}
                        <select
                            value={selectedDiocese}
                            onChange={(e) => onDioceseChange(e.target.value)}
                            style={selectStyle(
                                hasDiocese,
                                "#0B2040",
                                "rgba(11,32,64,0.06)",
                                "rgba(11,32,64,0.25)",
                            )}
                        >
                            <option value="">전체 교구</option>
                            {DIOCESES.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>

                        {/* 정렬 select */}
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            style={selectStyle(sortBy === "distance")}
                        >
                            <option value="date">날짜 가까운순</option>
                            <option value="latest">최근 등록순</option>
                            <option value="distance">📍 거리순</option>
                        </select>

                        {/* 구분선 */}
                        <div style={{ width: "1px", height: "16px", backgroundColor: "#E8E5DF" }} />

                        {/* 뷰 모드 토글 */}
                        {(["grid", "list"] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => onViewModeChange(mode)}
                                aria-label={mode === "grid" ? "그리드 보기" : "리스트 보기"}
                                style={{
                                    width: "30px",
                                    height: "30px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    border: "none",
                                    color: viewMode === mode ? "#0B2040" : "#9C9891",
                                    backgroundColor: viewMode === mode
                                        ? "rgba(11,32,64,0.07)"
                                        : "transparent",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {mode === "grid" ? (
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                        <rect x="0"   y="0"   width="5.5" height="5.5" rx="1" fill="currentColor" />
                                        <rect x="7.5" y="0"   width="5.5" height="5.5" rx="1" fill="currentColor" />
                                        <rect x="0"   y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
                                        <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                        <rect x="0" y="0"  width="13" height="2.5" rx="1" fill="currentColor" />
                                        <rect x="0" y="5"  width="13" height="2.5" rx="1" fill="currentColor" />
                                        <rect x="0" y="10" width="13" height="2.5" rx="1" fill="currentColor" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
