'use client';

import Image from "next/image";
import { useEffect } from "react";
import s from "./Lightbox.module.css";

export default function Lightbox({ photos, activeIndex, onClose, onNext, onPrev }) {
  const activePhoto = activeIndex === null ? null : photos[activeIndex];

  useEffect(() => {
    if (!activePhoto) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        onNext();
      }

      if (event.key === "ArrowLeft") {
        onPrev();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhoto, onClose, onNext, onPrev]);

  if (!activePhoto) {
    return null;
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <button className={s.closeButton} type="button" onClick={onClose} aria-label="Закрыть фото">
        ×
      </button>
      {photos.length > 1 && (
        <button className={`${s.navButton} ${s.prevButton}`} type="button" onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }} aria-label="Предыдущее фото">
          ‹
        </button>
      )}
      <div className={s.imageWrap} onClick={(event) => event.stopPropagation()}>
        <Image
          src={activePhoto.publicPath || activePhoto.image}
          alt={activePhoto.name || activePhoto.alt || "Фотография"}
          width={activePhoto.width || 1200}
          height={activePhoto.height || 800}
          className={s.image}
        />
        {(activePhoto.name || activePhoto.title) && <p className={s.caption}>{activePhoto.name || activePhoto.title}</p>}
      </div>
      {photos.length > 1 && (
        <button className={`${s.navButton} ${s.nextButton}`} type="button" onClick={(event) => {
          event.stopPropagation();
          onNext();
        }} aria-label="Следующее фото">
          ›
        </button>
      )}
    </div>
  );
}
