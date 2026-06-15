'use client';

import { useState } from "react";
import s from "./page.module.css"

const priceGroups = {
  event: {
    label: "На мероприятие",
    cards: [
      {
        id: "event-hour",
        title: "Почасовой тариф",
        className: s.eventHour,
        features: [
          "ТЗ от заказчика, по которому будет рассчитан пакет цен",
          "Можно обсудить личную фотосессию",
          "Готовый образ в облаке",
        ],
        note: "(облако указывается по желанию)",
        price: "4000 р час",
        size: "large",
      },
      {
        id: "event-full",
        title: "Полное мероприятие",
        className: s.eventFull,
        features: [
          "Обсуждение мероприятия, его специфики и время работы",
          "Отбор фотографий в альбом и облаке",
          "Работа от 4 часов включает в себя кормление фотографа",
        ],
        price: "12000 р",
        size: "small",
      },
      {
        id: "event-edit",
        title: "Фотокоррекция",
        className: s.eventEdit,
        features: [
          "Работу над фотографиями в Photoshop",
          "Стиль фотографий и их дизайн указывается лично заказчиком или предлагается личное виденье фотографа",
        ],
        price: "+3000 р к любому тарифу",
        size: "small",
      },
    ],
  },
  wedding: {
    label: "На свадьбу",
    cards: [
      {
        id: "wedding-full",
        title: "Полная свадьба",
        className: s.weddingFull,
        features: [
          "Фото подготовки к ЗАГСу",
          "Фото в ЗАГСе",
          "Личная фотосессия молодожёнов",
          "Фотосессия всего мероприятия после ЗАГСа до 23:00",
        ],
        price: "20000 р до 23:00",
        note: "После 23:00: каждый час + 1500р",
        size: "large",
      },
      {
        id: "wedding-registry",
        title: "От загса до личной фотосессии",
        className: s.weddingRegistry,
        features: [
          "Фото в ЗАГСе",
          "Личная фотосессия молодожёнов длиной в 1,5 часа",
        ],
        price: "10000 р",
        size: "small",
      },
      {
        id: "wedding-personal",
        title: "Личная фотосессия",
        className: s.weddingPersonal,
        features: [
          "Личная фотосессия молодожёнов длиной в 1,5 часа",
        ],
        price: "5000 р",
        size: "small",
      },
    ],
  },
};

export default function Page() {
  const [activeGroup, setActiveGroup] = useState("event");
  const currentGroup = priceGroups[activeGroup];
  const largeCard = currentGroup.cards.find((card) => card.size === "large");
  const smallCards = currentGroup.cards.filter((card) => card.size === "small");

  return (
    <main className={s.pricePage}>
      <h1>Цены</h1>

      <div className={s.tabs} aria-label="Переключение тарифов">
        {Object.entries(priceGroups).map(([key, group]) => (
          <button
            key={key}
            type="button"
            className={`${s.tab} ${activeGroup === key ? s.activeTab : ""}`}
            onClick={() => setActiveGroup(key)}
          >
            {group.label}
          </button>
        ))}
      </div>

      <section className={s.priceGrid}>
        {largeCard && <PriceCard card={largeCard} />}

        <div className={s.sideCards}>
          {smallCards.map((card) => (
            <PriceCard key={card.id} card={card} />
          ))}
        </div>
      </section>
    </main>
  )
}

function PriceCard({ card }) {
  return (
    <article className={`${s.priceCard} ${card.size === "large" ? s.largeCard : s.smallCard} ${card.className}`}>
      <div className={s.cardOverlay} />
      <div className={s.cardContent}>
        <h2>{card.title}</h2>
        <div className={s.includes}>
          <b>Включает в себя:</b>
          <ul>
            {card.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          {card.note && <p className={s.note}>{card.note}</p>}
        </div>
        <div className={s.priceBlock}>
          <span>Стоимость:</span>
          <strong>{card.price}</strong>
        </div>
      </div>
    </article>
  );
}
