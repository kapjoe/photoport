'use client'

import { useState } from "react"
import s from './page.module.css'
import Modal from "./Burger"
import Link from "next/link"

export const BurgerContainer = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const closeModal = () => {
        setIsClosing(true)
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false)
        }, 240)
    }

    const toggleModal = () => {
        if (!isModalOpen) {
            setIsModalOpen(true);
            return;
        }

        closeModal()
    }
    return (
        <>
            <button onClick={toggleModal} className={isModalOpen ? `active ${s.bgbtn}` : s.bgbtn} aria-label="Открыть меню">
                <svg width="75" height="75" viewBox="0 0 75 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 2L64 2" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <path d="M2 20H73" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <path d="M10 39L64 39" stroke="black" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </button>

            <Modal
                isOpen={isModalOpen}
                isClosing={isClosing}
                onClose={closeModal}
            >
                <Link href="/wedding" onClick={closeModal}>свадебное <br /> портфолио</Link>
                <Link href="/events" onClick={closeModal}>ивент <br /> портфолио</Link>
                <Link href="/price" onClick={closeModal}>Цены</Link>
                <Link href="/reviews" onClick={closeModal}>Отзывы</Link>
                <Link href="/about" onClick={closeModal}>Обо мне</Link>
                <Link href="/faq" onClick={closeModal}>ЧАВО</Link>
            </Modal>
        </>
    )
}