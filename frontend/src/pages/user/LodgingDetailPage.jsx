import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import StayMap from "../../components/common/StayMap";
import { readAuthSession } from "../../utils/authSession";
import { ReviewSection, RoomOptionsSection, StickyBookingCard } from "../../features/lodging-detail/LodgingDetailSections";
import {
  buildPropertyStory,
  buildRoomOptions,
  canWriteLodgingReview,
  getLodgingDetail,
  getReviewAverage,
} from "../../features/lodging-detail/lodgingDetailViewModel";
import { buildGalleryImages, getRoomMeta } from "../../features/lodging-detail/lodgingDetailUtils";
import { getLodgingReviews, getLodgings } from "../../services/lodgingService";
import { getMyBookings } from "../../services/mypageService";

export default function LodgingDetailPage() {
  const { lodgingId } = useParams();
  const location = useLocation();
  const lodgings = useMemo(() => getLodgings(), []);
  const lodgingReviews = useMemo(() => getLodgingReviews(), []);
  const myBookingRows = useMemo(() => getMyBookings(), []);
  const lodging = getLodgingDetail(lodgings, lodgingId);
  const roomOptions = useMemo(() => buildRoomOptions(lodging), [lodging]);
  const propertyStory = useMemo(() => buildPropertyStory(lodging), [lodging]);
  const galleryImages = useMemo(() => buildGalleryImages(lodging.image), [lodging.image]);
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [wishlisted, setWishlisted] = useState(false);
  const [shareLabel, setShareLabel] = useState("공유하기");
  const [reviewDraft, setReviewDraft] = useState({ score: 5, body: "", images: [] });
  const [reviews, setReviews] = useState(lodgingReviews);
  const reviewAverage = useMemo(() => getReviewAverage(reviews), [reviews]);
  const reviewSectionRef = useRef(null);
  const authSession = readAuthSession();
  const roomBaseMeta = getRoomMeta(selectedRoom.name);
  const canWriteReview = useMemo(
    () => canWriteLodgingReview(authSession, myBookingRows, lodging.id),
    [authSession, lodging.id, myBookingRows],
  );

  useEffect(() => {
    if (location.hash !== "#reviews") return;
    const timer = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  const handleShare = async () => {
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
      author: "내 후기",
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
        <span>{selectedRoom.name} 기준 객실/공용 공간 이미지를 먼저 확인하세요.</span>
      </div>

      <section className="detail-grid">
        <section className="detail-main">
          <div className="detail-headline">
            <span className="small-label">숙소 정보</span>
            <h2>{lodging.region} · {lodging.type}</h2>
            <p>{lodging.address}</p>
            <p>{lodging.intro}</p>
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
                <strong>투숙객 혜택</strong>
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
                  <li>객실별 취소 규정과 포함 혜택을 확인하세요.</li>
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
    </div>
  );
}
