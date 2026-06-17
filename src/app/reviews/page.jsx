'use client';
import s from "./page.module.css"
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const reviews = [
  {
    id: 'demo-1',
    name: 'Дмитрий',
    eventDate: '2025-06-14',
    eventType: 'Свадьба',
    text: 'Отличные фотографии. Рекомендую',
  },
  {
    id: 'demo-2',
    name: 'Агентство Party-Store',
    eventDate: '2025-07-20',
    eventType: 'Корпоратив',
    text: 'Идеально! Энергия и эмоции в каждом кадре.',
  },
  {
    id: 'demo-3',
    name: 'Виктория',
    eventDate: '2025-08-05',
    eventType: 'День рождения',
    text: 'Восторг! Фотограф поймал все эмоции.',
  },
  {
    id: 'demo-4',
    name: 'Анна и Максим',
    eventDate: '2025-09-12',
    eventType: 'Love story',
    text: 'Очень комфортная съёмка, фотографии получились живыми и тёплыми.',
  },
  {
    id: 'demo-5',
    name: 'Елена',
    eventDate: '2025-10-03',
    eventType: 'Семейная фотосессия',
    text: 'Евгений помог с позированием и поймал настроение всей семьи.',
  },
  {
    id: 'demo-6',
    name: 'Илья',
    eventDate: '2025-10-18',
    eventType: 'Спортивное мероприятие',
    text: 'Получился отличный репортаж, все ключевые моменты были пойманы.',
  },
  {
    id: 'demo-7',
    name: 'Мария',
    eventDate: '2025-11-02',
    eventType: 'Портретная съёмка',
    text: 'Съёмка прошла легко, а результат получился именно таким, как хотелось.',
  },
  {
    id: 'demo-8',
    name: 'Кирилл',
    eventDate: '2025-11-15',
    eventType: 'Выпускной',
    text: 'Фотографии передали атмосферу вечера и эмоции ребят.',
  },
  {
    id: 'demo-9',
    name: 'Ольга',
    eventDate: '2025-12-04',
    eventType: 'Детский праздник',
    text: 'Очень аккуратная работа с детьми и много живых кадров.',
  },
  {
    id: 'demo-10',
    name: 'Сергей',
    eventDate: '2025-12-21',
    eventType: 'Корпоратив',
    text: 'Быстро, профессионально и без лишней постановочности.',
  },
];

const initialForm = {
  name: '',
  eventDate: '',
  eventType: '',
  text: '',
};

const adminInitialState = {
  password: '',
  isUnlocked: false,
  error: '',
};

function getDistanceFromActive(index, activeIndex, length) {
  const directDistance = Math.abs(index - activeIndex);
  const loopDistance = length - directDistance;

  return Math.min(directDistance, loopDistance, 2);
}

function getCarouselReviews(reviewList) {
  if (reviewList.length >= 10) {
    return reviewList;
  }

  const existingIds = new Set(reviewList.map((review) => review.id));
  const fallback = reviews.filter((review) => !existingIds.has(review.id));

  return [...reviewList, ...fallback].slice(0, 10);
}

export default function Page() {
  const [reviewList, setReviewList] = useState(reviews);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [admin, setAdmin] = useState(adminInitialState);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  useEffect(() => {
    fetch('/api/reviews')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviewList(data.reviews);
        }
      })
      .catch(() => {
        setError('Отзывы из базы пока не загрузились. Можно оставить новый отзыв через форму.');
      });
  }, []);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось сохранить отзыв.');
      }

      setReviewList((current) => [data.review, ...current]);
      setActiveReviewIndex(0);
      setForm(initialForm);
      setStatus('Спасибо! Отзыв сохранён.');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAdminPanel = () => {
    setIsAdminOpen(true);
    setAdmin(adminInitialState);
  };

  const closeAdminPanel = () => {
    setIsAdminOpen(false);
    setAdmin(adminInitialState);
    setDeletingReviewId(null);
  };

  const unlockAdminPanel = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/reviews/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: admin.password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный пароль.');
      }

      setAdmin((current) => ({ ...current, isUnlocked: true, error: '' }));
    } catch (unlockError) {
      setAdmin((current) => ({ ...current, error: unlockError.message }));
    }
  };

  const deleteReviewItem = async (review) => {
    if (String(review.id).startsWith('demo-')) {
      setReviewList((current) => current.filter((item) => item.id !== review.id));
      return;
    }

    setDeletingReviewId(review.id);
    setAdmin((current) => ({ ...current, error: '' }));

    try {
      const response = await fetch('/api/reviews', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: review.id,
          password: admin.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить отзыв.');
      }

      setReviewList((current) => current.filter((item) => item.id !== review.id));
      setActiveReviewIndex(0);
    } catch (deleteError) {
      setAdmin((current) => ({ ...current, error: deleteError.message }));
    } finally {
      setDeletingReviewId(null);
    }
  };

  const carouselReviews = getCarouselReviews(reviewList);

  return (
    <main className={s.reviewsPage}>
      <h1 className={s.title}>Отзывы</h1>
      <Swiper
        className={s.reviewsSwiper}
        centeredSlides
        slidesPerView={5}
        spaceBetween={18}
        loop={carouselReviews.length > 5}
        breakpoints={{
          0: {
            slidesPerView: 1,
            spaceBetween: 12,
          },
          640: {
            slidesPerView: 3,
            spaceBetween: 14,
          },
          1024: {
            slidesPerView: 5,
            spaceBetween: 18,
          },
        }}
        onSwiper={(swiper) => setActiveReviewIndex(swiper.realIndex)}
        onSlideChange={(swiper) => setActiveReviewIndex(swiper.realIndex)}
      >
        {carouselReviews.map((review, index) => (
          <SwiperSlide key={review.id} className={`${s.review_slide} ${s[`review_slide_${getDistanceFromActive(index, activeReviewIndex, carouselReviews.length)}`]}`}>
            <article className={s.review_card}>
              <h3>{review.name}</h3>
              <span>{review.eventType} · {review.eventDate}</span>
              <p>{review.text}</p>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      <section className={s.formSection}>
        <h2>Оставить отзыв</h2>
        <form className={s.reviewForm} onSubmit={submitReview}>
          <label>
            Имя
            <input name="name" value={form.name} onChange={updateField} maxLength={80} required />
          </label>
          <label>
            Дата мероприятия
            <input name="eventDate" type="date" value={form.eventDate} onChange={updateField} required />
          </label>
          <label>
            Тип или название мероприятия
            <input name="eventType" value={form.eventType} onChange={updateField} maxLength={120} required />
          </label>
          <label>
            Отзыв
            <textarea name="text" value={form.text} onChange={updateField} maxLength={1200} rows={5} required />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : 'Отправить отзыв'}
          </button>
        </form>
        {status && <p className={s.success}>{status}</p>}
        {error && <p className={s.error}>{error}</p>}
      </section>

      <button className={s.adminButton} type="button" onClick={openAdminPanel} aria-label="Открыть меню управления отзывами">
        🔨
      </button>

      {isAdminOpen && (
        <div className={s.adminOverlay} onClick={closeAdminPanel}>
          <section className={s.adminPanel} onClick={(event) => event.stopPropagation()}>
            <div className={s.adminHeader}>
              <h2>Управление отзывами</h2>
              <button type="button" onClick={closeAdminPanel} aria-label="Закрыть меню управления">×</button>
            </div>

            {!admin.isUnlocked ? (
              <form className={s.adminLogin} onSubmit={unlockAdminPanel}>
                <label>
                  Пароль
                  <input
                    type="password"
                    value={admin.password}
                    onChange={(event) => setAdmin((current) => ({ ...current, password: event.target.value, error: '' }))}
                    autoFocus
                  />
                </label>
                <button type="submit">Открыть список</button>
              </form>
            ) : (
              <div className={s.adminList}>
                {reviewList.map((review) => (
                  <article className={s.adminReview} key={review.id}>
                    <div>
                      <h3>{review.name}</h3>
                      <span>{review.eventType} · {review.eventDate}</span>
                      <p>{review.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteReviewItem(review)}
                      disabled={deletingReviewId === review.id}
                    >
                      {deletingReviewId === review.id ? 'Удаляем...' : 'Удалить'}
                    </button>
                  </article>
                ))}
              </div>
            )}

            {admin.error && <p className={s.adminError}>{admin.error}</p>}
          </section>
        </div>
      )}
    </main>
  )
}
