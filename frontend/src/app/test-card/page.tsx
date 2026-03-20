"use client";
import { useEffect, useState } from "react";
import { generateHeartCard, generateCeciliaLetter } from "@/utils/heartCardCanvas";

export default function TestCardPage() {
    const [cardUrl, setCardUrl] = useState<string>("");
    const [letterUrl, setLetterUrl] = useState<string>("");

    useEffect(() => {
        (async () => {
            const card = await generateHeartCard({
                message: "당신의 마음에 평화가 깃들기를 기도합니다. 하느님께서는 언제나 당신 곁에 계십니다. 힘든 시간도 지나갈 것이며, 그 끝에는 반드시 빛이 있습니다. 주님의 사랑 안에서 위로를 받으시길 바랍니다.",
                hymn: "가톨릭 성가 142번 - 주님의 기도",
                emotionGrade: "consolatio",
                bibleVerse: "주님은 나의 목자, 나는 아쉬울 것 없어라. (시편 23:1)",
                cardNumber: 1,
                variant: 0,
            });
            setCardUrl(card);

            const letter = await generateCeciliaLetter({
                prayer: "사랑하는 이여, 오늘 하루도 주님의 은총 안에서 평안하시길 기도합니다. 당신이 느끼는 외로움과 슬픔을 주님께서 알고 계십니다. 그분의 따뜻한 손길이 당신의 마음을 어루만져 주실 것입니다. 언제나 당신 곁에 계신 하느님을 믿으세요.",
                emotionGrade: "consolatio",
                bibleVerse: "두려워하지 마라, 내가 너와 함께 있다. (이사야 41:10)",
                variant: 0,
            });
            setLetterUrl(letter);
        })();
    }, []);

    return (
        <div style={{ display: "flex", gap: 24, padding: 24, background: "#111", minHeight: "100vh", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start" }}>
            {cardUrl && <img src={cardUrl} alt="마음카드" style={{ width: 500, height: 500, borderRadius: 8 }} />}
            {letterUrl && <img src={letterUrl} alt="편지" style={{ width: 500, height: 500, borderRadius: 8 }} />}
            {!cardUrl && !letterUrl && <p style={{ color: "#fff", fontSize: 20 }}>생성 중...</p>}
        </div>
    );
}
