import s from "./page.module.css";

const faqItems = [
  {
    className: s.video,
    question: "Можете снять видео?",
    answer: "Нет. Я не могу реализовать профессиональную съёмку.",
  },
  {
    className: s.payment,
    question: "Принимаете оплату наличкой?",
    answer: "Да. Я принимаю оплату наличкой и переводом.",
  },
  {
    className: s.extraHour,
    question: "Можете пофотографировать еще час?",
    answer: "Конечно! Могу фотографировать столько, сколько вам нужно, но если это больше обговоренного времени, то придётся доплатить по 2000 за каждый лишний час.",
  },
  {
    className: s.contact,
    question: "Как с вами связаться?",
    answer: "На данном сайте имеются мои контактные данные, но дабы упростить задачу поиска вот они: @telegramprimer, primer@mail.ru",
  },
  {
    className: s.deadline,
    question: "Когда ждать фотографии?",
    answer: "Фотографии в среднем отправляются в течении 3 дней после фотосессии, но если в работе была постобработка, то срок увеличивается до недели.",
  },
];

export const metadata = {
  title: "ЧАВО | Kapralov Eugene",
};

export default function FaqPage() {
  return (
    <main className={s.page}>
      <h1>ЧАВО?</h1>
      <section className={s.faqGrid} aria-label="Часто задаваемые вопросы">
        {faqItems.map((item) => (
          <article className={`${s.card} ${item.className}`} key={item.question}>
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
