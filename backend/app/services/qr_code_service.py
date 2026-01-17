"""
Сервис генерации QR-кодов для инвентаря.

Генерирует QR-коды для быстрой идентификации предметов
через мобильное приложение или сканер.
"""
import io
from typing import Literal

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import (
    RoundedModuleDrawer,
    SquareModuleDrawer,
)
from PIL import Image


QRStyle = Literal["square", "rounded"]
QRFormat = Literal["png", "svg"]


class QRCodeService:
    """
    Сервис генерации QR-кодов.

    Создаёт QR-коды с закодированной информацией о предмете инвентаря.
    Поддерживает различные стили и форматы вывода.
    """

    def __init__(self, base_url: str | None = None):
        """
        Args:
            base_url: Базовый URL приложения для генерации ссылок.
                      Если не указан, кодируется только ID.
        """
        self._base_url = base_url

    def generate_inventory_qr(
        self,
        item_id: int,
        inventory_number: str,
        style: QRStyle = "rounded",
        size: int = 300,
        include_url: bool = True,
        include_number: bool = True,
    ) -> bytes:
        """
        Генерирует QR-код для предмета инвентаря.

        Args:
            item_id: ID предмета
            inventory_number: Инвентарный номер
            style: Стиль модулей ("square" или "rounded")
            size: Размер изображения в пикселях
            include_url: Включить URL в данные
            include_number: Включить инвентарный номер в данные

        Returns:
            PNG изображение в байтах
        """
        # Формируем данные для QR-кода
        if include_url and self._base_url:
            data = f"{self._base_url}/inventory/{item_id}"
        else:
            data = f"INV:{item_id}"

        if include_number:
            data = f"{data}|{inventory_number}"

        # Создаём QR-код
        qr = qrcode.QRCode(
            version=None,  # Автоопределение версии
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)

        # Выбираем стиль отрисовки
        module_drawer = (
            RoundedModuleDrawer() if style == "rounded" else SquareModuleDrawer()
        )

        # Генерируем изображение
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=module_drawer,
            fill_color="#0F1419",  # Тёмная тема
            back_color="white",
        )

        # Масштабируем до нужного размера
        img = img.resize((size, size), Image.Resampling.LANCZOS)

        # Конвертируем в байты
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        return buffer.getvalue()

    def generate_batch_qr(
        self,
        items: list[tuple[int, str]],
        style: QRStyle = "rounded",
        size: int = 200,
    ) -> list[tuple[int, bytes]]:
        """
        Генерирует QR-коды для нескольких предметов.

        Args:
            items: Список кортежей (item_id, inventory_number)
            style: Стиль модулей
            size: Размер изображения

        Returns:
            Список кортежей (item_id, png_bytes)
        """
        results = []
        for item_id, inventory_number in items:
            qr_bytes = self.generate_inventory_qr(
                item_id=item_id,
                inventory_number=inventory_number,
                style=style,
                size=size,
            )
            results.append((item_id, qr_bytes))
        return results

    def generate_label_sheet(
        self,
        items: list[tuple[int, str, str]],
        cols: int = 3,
        rows: int = 8,
        qr_size: int = 100,
        include_text: bool = True,
    ) -> bytes:
        """
        Генерирует лист с этикетками для печати.

        Args:
            items: Список кортежей (item_id, inventory_number, name)
            cols: Количество колонок на листе
            rows: Количество строк на листе
            qr_size: Размер QR-кода в пикселях
            include_text: Включить текст под QR-кодом

        Returns:
            PNG изображение листа
        """
        from PIL import ImageDraw, ImageFont

        # A4 размер в пикселях при 150 DPI
        page_width = 1240
        page_height = 1754

        # Создаём белый лист
        sheet = Image.new("RGB", (page_width, page_height), "white")
        draw = ImageDraw.Draw(sheet)

        # Рассчитываем размеры ячеек
        cell_width = page_width // cols
        cell_height = page_height // rows

        # Пытаемся загрузить шрифт
        try:
            font = ImageFont.truetype("arial.ttf", 12)
            font_small = ImageFont.truetype("arial.ttf", 10)
        except OSError:
            font = ImageFont.load_default()
            font_small = font

        # Размещаем QR-коды
        for idx, (item_id, inv_number, name) in enumerate(items):
            if idx >= cols * rows:
                break  # Превышен лимит на страницу

            col = idx % cols
            row = idx // cols

            x = col * cell_width + (cell_width - qr_size) // 2
            y = row * cell_height + 10

            # Генерируем QR-код
            qr_bytes = self.generate_inventory_qr(
                item_id=item_id,
                inventory_number=inv_number,
                style="square",
                size=qr_size,
            )
            qr_img = Image.open(io.BytesIO(qr_bytes))

            # Вставляем QR-код
            sheet.paste(qr_img, (x, y))

            if include_text:
                # Добавляем текст
                text_x = col * cell_width + 5
                text_y = y + qr_size + 5

                # Инвентарный номер
                draw.text((text_x, text_y), inv_number, fill="black", font=font)

                # Название (обрезаем если длинное)
                short_name = name[:25] + "..." if len(name) > 28 else name
                draw.text(
                    (text_x, text_y + 15),
                    short_name,
                    fill="gray",
                    font=font_small,
                )

        # Конвертируем в байты
        buffer = io.BytesIO()
        sheet.save(buffer, format="PNG")
        buffer.seek(0)

        return buffer.getvalue()

    @staticmethod
    def decode_qr_data(data: str) -> dict:
        """
        Декодирует данные из QR-кода.

        Args:
            data: Строка из QR-кода

        Returns:
            Словарь с item_id и inventory_number
        """
        result = {"item_id": None, "inventory_number": None, "url": None}

        if data.startswith("http"):
            result["url"] = data
            # Извлекаем ID из URL
            parts = data.split("/")
            if "inventory" in parts:
                idx = parts.index("inventory")
                if idx + 1 < len(parts):
                    id_part = parts[idx + 1].split("|")[0]
                    result["item_id"] = int(id_part)

        elif data.startswith("INV:"):
            # Формат INV:123|INV-2025-00001
            parts = data[4:].split("|")
            result["item_id"] = int(parts[0])
            if len(parts) > 1:
                result["inventory_number"] = parts[1]

        # Проверяем есть ли инвентарный номер в конце
        if "|" in data and not result["inventory_number"]:
            result["inventory_number"] = data.split("|")[-1]

        return result
