'use client';
import s from "./page.module.css"
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { useEffect, useState } from "react";
import Lightbox from "@/components/Lightbox";


const fallbackPhotos = Array.from({ length: 6 }, (_, index) => ({
  id: `placeholder-${index + 1}`,
  image: "/image/photo-placeholder.svg",
  alt: "Место для фотографии из портфолио",
}));

function shufflePhotos(photos) {
  const shuffled = [...photos];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

const MainPage = () => {
  const [photos, setPhotos] = useState(fallbackPhotos);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/photos")
      .then((response) => response.json())
      .then((data) => {
        const cachedPhotos = Array.isArray(data.photos) ? shufflePhotos(data.photos) : [];

        if (isMounted && cachedPhotos.length > 0) {
          setPhotos(
            cachedPhotos.map((photo) => ({
              id: photo.id,
              image: photo.publicPath,
              publicPath: photo.publicPath,
              alt: photo.name || "Фотография из портфолио",
              name: photo.name,
              width: photo.width,
              height: photo.height,
            })),
          );
        }
      })
      .catch(() => {
        // Если кеш еще пустой или API недоступен, остаются плейсхолдеры.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <div className={s.maintop}>
          <h1 className={s.h1}>Капралов Евгений</h1>
          <p>ивентовый и свадебный фотограф</p>
      </div>
      <main className={s.main}>
        <div className={s.swiperWrap}>
          <Swiper
            className={s.swiper}
            modules={[Autoplay]}
            spaceBetween={5}
            slidesPerView={1}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 5,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 5,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 5,
              },
            }}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              waitForTransition: true,
            }}
            speed={3000}
            loop={photos.length > 1}
            grabCursor={true}
          >
            {photos.map((card) => (
              <SwiperSlide key={card.id} className={s.slide}>
                <button
                  className={s.swiperImg}
                  type="button"
                  onClick={() => setActivePhotoIndex(photos.findIndex((photo) => photo.id === card.id))}
                  aria-label={`Открыть фото ${card.alt}`}
                >
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    className={s.slideImage}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </main>
      <Lightbox
        photos={photos}
        activeIndex={activePhotoIndex}
        onClose={() => setActivePhotoIndex(null)}
        onNext={() => setActivePhotoIndex((current) => (current === null ? 0 : (current + 1) % photos.length))}
        onPrev={() => setActivePhotoIndex((current) => (current === null ? 0 : (current - 1 + photos.length) % photos.length))}
      />
      <footer className={s.footer}>
        <p>©Kapralov Eugene</p>
        <div className={s.footer_Links}>
          <a href="https://t.me/kapjoe" target="_blank" rel="noreferrer"><Image src="/image/tg.svg" alt="Telegram" width={30} height={30} /></a>
          <a href="https://vk.com/"><Image src="/image/vk-com.svg" alt="VK" width={30} height={30} /></a>
          <p>+79154540005</p>
        </div>
      </footer>
    </>
  )
};

export default MainPage
