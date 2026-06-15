'use client';

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Lightbox from "@/components/Lightbox";
import s from "./photoSessions.module.css";

const fallbackPhoto = {
  id: "placeholder-photo",
  name: "Место для фотографии",
  publicPath: "/image/photo-placeholder.svg",
  width: 900,
  height: 600,
  orientation: "horizontal",
};

const fallbackAlbums = [
  {
    id: "placeholder-album",
    title: "Фотосессия появится после синхронизации",
    cover: fallbackPhoto,
    photos: [fallbackPhoto],
  },
];

function buildRows(photos) {
  const rows = [];
  const verticalPhotos = photos.filter((photo) => photo.orientation === "vertical");
  const horizontalPhotos = photos.filter((photo) => photo.orientation === "horizontal" || photo.orientation === "square");
  const rowsCount = Math.min(Math.floor(verticalPhotos.length / 2), Math.floor(horizontalPhotos.length / 2));

  for (let index = 0; index < rowsCount; index += 1) {
    const reversed = rows.length % 2 === 1;
    const verticalIndex = index * 2;
    const horizontalIndex = index * 2;

    rows.push({
      id: `row-${rows.length}`,
      reversed,
      verticals: verticalPhotos.slice(verticalIndex, verticalIndex + 2),
      horizontals: horizontalPhotos.slice(horizontalIndex, horizontalIndex + 2),
    });
  }

  return rows;
}

function getPhotoIndex(photos, photo) {
  return photos.findIndex((item) => item.id === photo.id);
}

export default function PhotoSessionsPage({ categoryId, title }) {
  const [albums, setAlbums] = useState(fallbackAlbums);
  const [activeAlbumId, setActiveAlbumId] = useState(fallbackAlbums[0].id);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/photos?category=${categoryId}`)
      .then((response) => response.json())
      .then((data) => {
        const nextAlbums = Array.isArray(data.albums) && data.albums.length > 0 ? data.albums : fallbackAlbums;

        if (isMounted) {
          setAlbums(nextAlbums);
          setActiveAlbumId(nextAlbums[0]?.id || fallbackAlbums[0].id);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAlbums(fallbackAlbums);
          setActiveAlbumId(fallbackAlbums[0].id);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  const activeAlbum = albums.find((album) => album.id === activeAlbumId) || albums[0];
  const photos = useMemo(() => activeAlbum?.photos || [], [activeAlbum]);
  const rows = useMemo(() => buildRows(photos), [photos]);

  return (
    <main className={s.page}>
      <h1>{title}</h1>
      <p className={s.lead}>
        Выберите фотосессию в слайдере ниже, чтобы посмотреть фотографии из выбранной папки.
      </p>

      <section className={s.albumSection} aria-label="Список фотосессий">
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={18}
          slidesPerView={1.1}
          breakpoints={{
            640: {
              slidesPerView: 2.2,
            },
            1024: {
              slidesPerView: 3.2,
            },
          }}
        >
          {albums.map((album) => (
            <SwiperSlide key={album.id}>
              <button
                className={`${s.albumCard} ${album.id === activeAlbumId ? s.activeAlbum : ""}`}
                type="button"
                onClick={() => {
                  setActiveAlbumId(album.id);
                  setActivePhotoIndex(null);
                }}
              >
                <Image
                  src={album.cover?.publicPath || "/image/photo-placeholder.svg"}
                  alt={album.title}
                  width={album.cover?.width || 700}
                  height={album.cover?.height || 460}
                />
                <span>{album.title}</span>
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <section className={s.gallery} aria-label={`Фотографии: ${activeAlbum?.title || title}`}>
        <div className={s.galleryHeader}>
          <h2>{activeAlbum?.title}</h2>
          {isLoading && <p>Загружаем фотосессии...</p>}
        </div>

        {rows.map((row) => (
          <div className={`${s.mosaicRow} ${row.reversed ? s.reversedRow : ""}`} key={row.id}>
            <div className={s.mobileVerticals}>
              {row.verticals.map((photo) => (
                <button
                  className={s.mobileVerticalPhoto}
                  type="button"
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(getPhotoIndex(photos, photo))}
                >
                  <Image
                    src={photo.publicPath}
                    alt={photo.name || activeAlbum.title}
                    width={photo.width || 700}
                    height={photo.height || 1000}
                  />
                </button>
              ))}
            </div>
            {row.verticals[0] && (
              <button
                className={s.verticalPhoto}
                type="button"
                onClick={() => setActivePhotoIndex(getPhotoIndex(photos, row.reversed ? row.verticals[1] || row.verticals[0] : row.verticals[0]))}
              >
                <Image
                  src={(row.reversed ? row.verticals[1] || row.verticals[0] : row.verticals[0]).publicPath}
                  alt={(row.reversed ? row.verticals[1] || row.verticals[0] : row.verticals[0]).name || activeAlbum.title}
                  width={(row.reversed ? row.verticals[1] || row.verticals[0] : row.verticals[0]).width || 700}
                  height={(row.reversed ? row.verticals[1] || row.verticals[0] : row.verticals[0]).height || 1000}
                />
              </button>
            )}
            <div className={s.horizontalStack}>
              {row.horizontals.map((photo) => (
                <button
                  className={s.horizontalPhoto}
                  type="button"
                  key={photo.id}
                  onClick={() => setActivePhotoIndex(getPhotoIndex(photos, photo))}
                >
                  <Image
                    src={photo.publicPath}
                    alt={photo.name || activeAlbum.title}
                    width={photo.width || 900}
                    height={photo.height || 600}
                  />
                </button>
              ))}
            </div>
            {row.horizontals[0] && (
              <button
                className={s.mobileHorizontalPhoto}
                type="button"
                onClick={() => setActivePhotoIndex(getPhotoIndex(photos, row.horizontals[0]))}
              >
                <Image
                  src={row.horizontals[0].publicPath}
                  alt={row.horizontals[0].name || activeAlbum.title}
                  width={row.horizontals[0].width || 900}
                  height={row.horizontals[0].height || 600}
                />
              </button>
            )}
          </div>
        ))}
      </section>

      <Lightbox
        photos={photos}
        activeIndex={activePhotoIndex}
        onClose={() => setActivePhotoIndex(null)}
        onNext={() => setActivePhotoIndex((current) => (current === null ? 0 : (current + 1) % photos.length))}
        onPrev={() => setActivePhotoIndex((current) => (current === null ? 0 : (current - 1 + photos.length) % photos.length))}
      />
    </main>
  );
}
