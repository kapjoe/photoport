import "./globals.css";
import { Jura } from "next/font/google";

import { BurgerContainer } from "../components/BurgerContainer";

const jura = Jura({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: "Kapralov Eugene | Фотограф",
  description: "Портфолио и отзывы ивентового и свадебного фотографа",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className={jura.className}>
        <BurgerContainer />
        {children}
      </body>
    </html>
  );
}
