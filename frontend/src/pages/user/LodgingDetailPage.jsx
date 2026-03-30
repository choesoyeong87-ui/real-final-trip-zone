import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import StayMap from "../../components/common/StayMap";
import { readAuthSession } from "../../utils/authSession";
import { ReviewSection, RoomOptionsSection, StickyBookingCard } from "../../features/lodging-detail/LodgingDetailSections";
import {
  buildPropertyStory,
  buildRoomOptions,
  canWriteLodgingReview,
  getReviewAverage,
} from "../../features/lodging-detail/lodgingDetailViewModel";
import { buildGalleryImages, getRoomMeta } from "../../features/lodging-detail/lodgingDetailUtils";
import { getLodgingDetailById, getLodgingReviews } from "../../services/lodgingService";
import { getMyBookings } from "../../services/mypageService";

const sellerContactByLodging = {
  default: {
    name: "TripZone 호스트",
    badge: "평균 10분 내 응답",
    status: "실시간 문의 가능",
    messages: [
      { id: "seller-1", sender: "seller", time: "방금 전", body: "안녕하세요. 체크인 시간이나 객실 옵션이 궁금하시면 편하게 문의해 주세요." },
    ],
  },
};

export default function LodgingDetailPage() {
  const { lodgingId } = useParams();
  const location = useLocation();
  const [lodging, setLodging] = useState(null);
  const lodgingReviews = useMemo(() => getLodgingReviews(), []);
  const myBookingRows = useMemo(() => getMyBookings(), []);
  const roomOptions = useMemo(() => (lodging ? buildRoomOptions(lodging) : []), [lodging]);
  const propertyStory = useMemo(() => (lodging ? buildPropertyStory(lodging) : []), [lodging]);
  const galleryImages = useMemo(() => buildGalleryImages(lodging?.image ?? ""), [lodging?.image]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [shareLabel, setShareLabel] = useState("공유하기");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState({ score: 5, body: "", images: [] });
  const [reviews, setReviews] = useState(lodgingReviews);
  const sellerContact = sellerContactByLodging[lodging?.id] ?? sellerContactByLodging.default;
  const [chatMessages, setChatMessages] = useState(sellerContact.messages);
  const reviewAverage = useMemo(() => getReviewAverage(reviews), [reviews]);
  const reviewSectionRef = useRef(null);
  const inquiryThreadRef = useRef(null);
  const authSession = readAuthSession();
  const roomBaseMeta = getRoomMeta(selectedRoom?.name ?? "");
  const canWriteReview = useMemo(
    () => canWriteLodgingReview(authSession, myBookingRows, lodging?.id ?? 0),
    [authSession, lodging?.id, myBookingRows],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLodging() {
      try {
        const nextLodging = await getLodgingDetailById(lodgingId);
        if (cancelled) return;
        setLodging(nextLodging);
      } catch (error) {
        console.error("Failed to load lodging detail.", error);
      }
    }

    loadLodging();

    return () => {
      cancelled = true;
    };
  }, [lodgingId]);

  useEffect(() => {
    if (location.hash !== "#reviews") return;
    const timer = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  useEffect(() => {
    setChatMessages(sellerContact.messages);
  }, [sellerContact]);

  useEffect(() => {
    if (!roomOptions.length) return;
    setSelectedRoom(roomOptions[0]);
  }, [roomOptions]);

  useEffect(() => {
    if (!galleryImages.length) return;
    setSelectedImage(galleryImages[0]);
  }, [galleryImages]);

  useEffect(() => {
    if (!isInquiryOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsInquiryOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const timer = window.setTimeout(() => {
      inquiryThreadRef.current?.scrollTo({ top: inquiryThreadRef.current.scrollHeight, behavior: "smooth" });
    }, 40);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [isInquiryOpen, chatMessages]);

  const handleShare = async () => {
    if (!lodging) return;
    const targetUrl = `${window.location.origin}/lodgings/${lodging.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        setShareLabel("링크 복사됨");
        window.setTimeout(() => setShareLabel("공유하기"), 1800);
      }
    } catch {
      setShareLabel("공유하기");
    }
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    const body = reviewDraft.body.trim();
    if (!body) return;

    const nextReview = {
      author: "TripZone 사용자",
      score: reviewDraft.score.toFixed(1),
      stay: "방금 작성",
      body,
      images: reviewDraft.images,
    };

    setReviews((current) => [nextReview, ...current]);
    setReviewDraft({ score: 5, body: "", images: [] });
  };

  const handleReviewImages = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const nextImages = files.slice(0, 3).map((file) => URL.createObjectURL(file));
    setReviewDraft((current) => ({ ...current, images: nextImages }));
  };

  const handleInquirySubmit = (event) => {
    event.preventDefault();
    const body = chatDraft.trim();
    if (!body) return;

    setChatMessages((current) => [
      ...current,
      { id: `guest-${Date.now()}`, sender: "guest", time: "방금 전", body },
      { id: `seller-${Date.now() + 1}`, sender: "seller", time: "응답 예정", body: "문의 감사합니다. 호스트가 확인 후 답변드릴게요." },
    ]);
    setChatDraft("");
  };

  if (!lodging || !selectedRoom) {
    return (
      <div className="container page-stack">
        <section className="list-empty-state list-empty-state-full">
          <strong>숙소 상세를 불러오는 중입니다.</strong>
          <p>백엔드에서 숙소와 객실 정보를 가져오고 있어요.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-stack">
      <section className="lodging-hero">
        <div className="lodging-hero-visual" style={{ backgroundImage: `url(${selectedImage})` }} />
        <div className="lodging-hero-copy">
          <p className="eyebrow hero-eyebrow">{lodging.region}</p>
          <h1>{lodging.name}</h1>
          <p>{lodging.intro}</p>
          <div className="detail-hero-meta">
            <span>{lodging.region} · {lodging.district}</span>
            <button
              type="button"
              className="detail-hero-review-chip"
              onClick={() => reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              ★ {lodging.rating} · {lodging.reviewCount}
            </button>
            <span>{lodging.cancellation}</span>
          </div>
          <div className="feature-chip-row">
            {lodging.highlights.map((item) => (
              <span key={item} className="inline-chip inline-chip-light">
                {item}
              </span>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to={`/booking/${lodging.id}`}>
              예약하기
            </Link>
            <button type="button" className={`detail-utility-button detail-utility-button-like${wishlisted ? " is-active" : ""}`} onClick={() => setWishlisted((current) => !current)}>
              {wishlisted ? "찜 완료" : "찜하기"}
            </button>
            <button type="button" className="detail-utility-button detail-utility-button-share" onClick={handleShare}>
              {shareLabel}
            </button>
            <button type="button" className="detail-utility-button detail-utility-button-inquiry" onClick={() => setIsInquiryOpen(true)}>
              숙소문의
            </button>
          </div>
        </div>
      </section>

      <div className="detail-gallery-strip">
        {galleryImages.map((image, index) => (
          <button
            key={`${lodging.id}-${index}`}
            type="button"
            className={`detail-gallery-thumb${selectedImage === image ? " is-active" : ""}`}
            style={{ backgroundImage: `url(${image})` }}
            onClick={() => setSelectedImage(image)}
            aria-label={`숙소 사진 ${index + 1}`}
          />
        ))}
      </div>

      <div className="detail-photo-meta">
        <strong>숙소 사진 {galleryImages.indexOf(selectedImage) + 1}</strong>
        <span>{selectedRoom.name} 기준 이미지와 숙소 전경을 확인해 보세요.</span>
      </div>

      <section className="detail-grid">
        <section className="detail-main">
          <div className="detail-headline">
            <span className="small-label">숙소 정보</span>
            <h2>{lodging.region} · {lodging.type}</h2>
            <p>{lodging.address}</p>
          </div>

          <div className="detail-info-rail">
            <div className="detail-info-item">
              <strong>평점</strong>
              <p>★ {lodging.rating} · {lodging.reviewCount}</p>
            </div>
            <div className="detail-info-item">
              <strong>체크인</strong>
              <p>{lodging.checkInTime}</p>
            </div>
            <div className="detail-info-item">
              <strong>체크아웃</strong>
              <p>{lodging.checkOutTime}</p>
            </div>
            <div className="detail-info-item">
              <strong>취소 정책</strong>
              <p>{lodging.cancellation}</p>
            </div>
          </div>

          <RoomOptionsSection lodging={lodging} roomOptions={roomOptions} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">숙소 소개</span>
            </div>
            <div className="detail-story">
              {propertyStory.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </section>

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">기본 정보</span>
              <h2>이용 안내</h2>
            </div>
            <div className="detail-guide-list">
              <div className="detail-guide-item">
                <strong>기본 정보</strong>
                <ul className="detail-guide-bullets">
                  <li>{lodging.checkInTime} 체크인 · {lodging.checkOutTime} 체크아웃</li>
                  <li>{lodging.room}</li>
                  <li>{lodging.type}</li>
                </ul>
              </div>
              <div className="detail-guide-item">
                <strong>추천 포인트</strong>
                <ul className="detail-guide-bullets">
                  {lodging.highlights.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-guide-item">
                <strong>확인 사항</strong>
                <ul className="detail-guide-bullets">
                  <li>{lodging.cancellation}</li>
                  <li>{lodging.benefit}</li>
                  <li>예약 단계에서 객실 조건과 취소 정책을 다시 확인해 주세요.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">위치</span>
              <h2>숙소 위치</h2>
            </div>
            <StayMap items={[lodging]} selectedId={lodging.id} height={360} single />
          </section>

          <section ref={reviewSectionRef}>
            <ReviewSection
              authSession={authSession}
              canWriteReview={canWriteReview}
              galleryImages={galleryImages}
              lodging={lodging}
              reviewAverage={reviewAverage}
              reviewDraft={reviewDraft}
              reviews={reviews}
              onChangeDraft={(patch) => setReviewDraft((current) => ({ ...current, ...patch }))}
              onSubmit={handleReviewSubmit}
              onImageChange={handleReviewImages}
            />
          </section>
        </section>

        <StickyBookingCard lodging={lodging} selectedRoom={selectedRoom} roomBaseMeta={roomBaseMeta} />
      </section>

      {isInquiryOpen && (
        <div className="lodging-inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="lodging-inquiry-title">
          <button type="button" className="lodging-inquiry-backdrop" aria-label="문의 팝업 닫기" onClick={() => setIsInquiryOpen(false)} />
          <section className="lodging-inquiry-sheet">
            <header className="lodging-inquiry-header">
              <div className="lodging-inquiry-host">
                <span className="lodging-inquiry-avatar">{sellerContact.name.slice(0, 1)}</span>
                <div>
                  <p className="lodging-inquiry-eyebrow">숙소 문의</p>
                  <h2 id="lodging-inquiry-title">{sellerContact.name}</h2>
                  <div className="lodging-inquiry-status">
                    <span>{sellerContact.status}</span>
                    <span>{sellerContact.badge}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="lodging-inquiry-close" onClick={() => setIsInquiryOpen(false)}>
                닫기
              </button>
            </header>

            <div className="lodging-inquiry-summary">
              <strong>{lodging.name}</strong>
              <span>{selectedRoom.name} · {lodging.checkInTime} 체크인 · {lodging.cancellation}</span>
            </div>

            <div className="lodging-inquiry-thread" ref={inquiryThreadRef}>
              {chatMessages.map((message) => (
                <article key={message.id} className={`lodging-chat-bubble is-${message.sender}`}>
                  <span className="lodging-chat-time">{message.time}</span>
                  <p>{message.body}</p>
                </article>
              ))}
            </div>

            <form className="lodging-inquiry-form" onSubmit={handleInquirySubmit}>
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="체크인 시간, 객실 옵션, 주차 여부처럼 예약 전에 확인하고 싶은 내용을 남겨 보세요."
                rows={3}
              />
              <div className="lodging-inquiry-form-foot">
                <span>응답은 이 창 안에서 이어집니다.</span>
                <button type="submit" className="primary-button">
                  보내기
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
