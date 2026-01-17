"""
Сервис работы с повторяющимися событиями.

Поддерживает RFC 5545 RRule формат для повторяющихся событий.
"""
from datetime import date, datetime, time, timedelta
from typing import Optional
from dataclasses import dataclass

from dateutil.rrule import rrule, rrulestr, DAILY, WEEKLY, MONTHLY, YEARLY
from dateutil.rrule import MO, TU, WE, TH, FR, SA, SU

from app.core.exceptions import ValidationError


@dataclass
class RecurrencePattern:
    """Паттерн повторения события."""

    frequency: str  # DAILY, WEEKLY, MONTHLY, YEARLY
    interval: int = 1  # Каждые N периодов
    count: Optional[int] = None  # Количество повторений
    until: Optional[date] = None  # Повторять до даты
    by_day: Optional[list[str]] = None  # Дни недели (MO, TU, WE, ...)
    by_month_day: Optional[list[int]] = None  # Дни месяца (1-31)
    by_month: Optional[list[int]] = None  # Месяцы (1-12)
    exceptions: Optional[list[date]] = None  # Исключённые даты


@dataclass
class RecurrenceInstance:
    """Экземпляр повторяющегося события."""

    date: date
    start_time: time
    end_time: Optional[time]
    is_exception: bool = False
    is_modified: bool = False


class RecurrenceService:
    """
    Сервис работы с повторяющимися событиями.

    Возможности:
    - Парсинг RFC 5545 RRule строк
    - Генерация экземпляров повторяющихся событий
    - Создание RRule строк из паттернов
    - Управление исключениями
    """

    # Mapping of day names to dateutil constants
    DAY_MAP = {
        'MO': MO, 'TU': TU, 'WE': WE, 'TH': TH,
        'FR': FR, 'SA': SA, 'SU': SU
    }

    # Mapping of frequency names to dateutil constants
    FREQ_MAP = {
        'DAILY': DAILY,
        'WEEKLY': WEEKLY,
        'MONTHLY': MONTHLY,
        'YEARLY': YEARLY,
    }

    # Russian labels for frequencies
    FREQ_LABELS = {
        'DAILY': 'Ежедневно',
        'WEEKLY': 'Еженедельно',
        'MONTHLY': 'Ежемесячно',
        'YEARLY': 'Ежегодно',
    }

    # Russian day names
    DAY_LABELS = {
        'MO': 'Пн', 'TU': 'Вт', 'WE': 'Ср', 'TH': 'Чт',
        'FR': 'Пт', 'SA': 'Сб', 'SU': 'Вс'
    }

    def parse_rrule(self, rrule_string: str) -> RecurrencePattern:
        """
        Парсинг RFC 5545 RRule строки в RecurrencePattern.

        Args:
            rrule_string: RRule строка (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10")

        Returns:
            RecurrencePattern с распарсенными параметрами

        Raises:
            ValidationError: Если строка некорректна
        """
        if not rrule_string:
            raise ValidationError("RRule строка не может быть пустой")

        try:
            # Parse using dateutil
            parts = {}
            for part in rrule_string.split(';'):
                if '=' in part:
                    key, value = part.split('=', 1)
                    parts[key.upper()] = value

            frequency = parts.get('FREQ', 'WEEKLY')
            if frequency not in self.FREQ_MAP:
                raise ValidationError(f"Неизвестная частота: {frequency}")

            pattern = RecurrencePattern(
                frequency=frequency,
                interval=int(parts.get('INTERVAL', 1)),
            )

            # Count
            if 'COUNT' in parts:
                pattern.count = int(parts['COUNT'])

            # Until
            if 'UNTIL' in parts:
                until_str = parts['UNTIL']
                if len(until_str) == 8:  # YYYYMMDD
                    pattern.until = datetime.strptime(until_str, '%Y%m%d').date()
                else:  # ISO format with time
                    pattern.until = datetime.fromisoformat(until_str.replace('Z', '+00:00')).date()

            # By day
            if 'BYDAY' in parts:
                pattern.by_day = parts['BYDAY'].split(',')

            # By month day
            if 'BYMONTHDAY' in parts:
                pattern.by_month_day = [int(d) for d in parts['BYMONTHDAY'].split(',')]

            # By month
            if 'BYMONTH' in parts:
                pattern.by_month = [int(m) for m in parts['BYMONTH'].split(',')]

            return pattern

        except Exception as e:
            raise ValidationError(f"Ошибка парсинга RRule: {str(e)}")

    def build_rrule(self, pattern: RecurrencePattern) -> str:
        """
        Создание RFC 5545 RRule строки из RecurrencePattern.

        Args:
            pattern: Паттерн повторения

        Returns:
            RRule строка

        Raises:
            ValidationError: Если паттерн некорректен
        """
        if pattern.frequency not in self.FREQ_MAP:
            raise ValidationError(f"Неизвестная частота: {pattern.frequency}")

        parts = [f"FREQ={pattern.frequency}"]

        if pattern.interval and pattern.interval > 1:
            parts.append(f"INTERVAL={pattern.interval}")

        if pattern.count:
            parts.append(f"COUNT={pattern.count}")

        if pattern.until:
            parts.append(f"UNTIL={pattern.until.strftime('%Y%m%d')}")

        if pattern.by_day:
            parts.append(f"BYDAY={','.join(pattern.by_day)}")

        if pattern.by_month_day:
            parts.append(f"BYMONTHDAY={','.join(map(str, pattern.by_month_day))}")

        if pattern.by_month:
            parts.append(f"BYMONTH={','.join(map(str, pattern.by_month))}")

        return ';'.join(parts)

    def generate_instances(
        self,
        rrule_string: str,
        start_date: date,
        start_time: time,
        end_time: Optional[time],
        range_start: date,
        range_end: date,
        exceptions: Optional[list[date]] = None,
        max_instances: int = 100,
    ) -> list[RecurrenceInstance]:
        """
        Генерация экземпляров повторяющегося события за период.

        Args:
            rrule_string: RRule строка
            start_date: Дата начала повторения
            start_time: Время начала события
            end_time: Время окончания события
            range_start: Начало периода для генерации
            range_end: Конец периода для генерации
            exceptions: Список исключённых дат
            max_instances: Максимальное количество экземпляров

        Returns:
            Список RecurrenceInstance
        """
        if not rrule_string:
            return []

        exceptions = exceptions or []

        try:
            # Create datetime for start
            start_dt = datetime.combine(start_date, start_time)

            # Parse rrule
            rule = rrulestr(rrule_string, dtstart=start_dt)

            # Generate occurrences
            instances = []
            range_start_dt = datetime.combine(range_start, time(0, 0, 0))
            range_end_dt = datetime.combine(range_end, time(23, 59, 59))

            for occurrence in rule.between(range_start_dt, range_end_dt, inc=True):
                if len(instances) >= max_instances:
                    break

                occurrence_date = occurrence.date()

                # Skip exceptions
                is_exception = occurrence_date in exceptions
                if is_exception:
                    continue

                instances.append(RecurrenceInstance(
                    date=occurrence_date,
                    start_time=start_time,
                    end_time=end_time,
                    is_exception=False,
                    is_modified=False,
                ))

            return instances

        except Exception as e:
            raise ValidationError(f"Ошибка генерации повторений: {str(e)}")

    def get_next_occurrence(
        self,
        rrule_string: str,
        start_date: date,
        start_time: time,
        after: Optional[date] = None,
        exceptions: Optional[list[date]] = None,
    ) -> Optional[date]:
        """
        Получить следующую дату повторения.

        Args:
            rrule_string: RRule строка
            start_date: Дата начала повторения
            start_time: Время начала события
            after: После какой даты искать (по умолчанию сегодня)
            exceptions: Список исключённых дат

        Returns:
            Следующая дата или None
        """
        if not rrule_string:
            return None

        after = after or date.today()
        exceptions = exceptions or []

        try:
            start_dt = datetime.combine(start_date, start_time)
            rule = rrulestr(rrule_string, dtstart=start_dt)

            after_dt = datetime.combine(after, time(0, 0, 0))

            # Get next occurrence after the given date
            for occurrence in rule:
                if occurrence.date() > after and occurrence.date() not in exceptions:
                    return occurrence.date()
                # Safety limit
                if occurrence > after_dt + timedelta(days=365 * 5):
                    break

            return None

        except Exception:
            return None

    def describe_pattern(self, rrule_string: str) -> str:
        """
        Создание человекочитаемого описания паттерна повторения.

        Args:
            rrule_string: RRule строка

        Returns:
            Описание на русском языке
        """
        if not rrule_string:
            return "Без повторения"

        try:
            pattern = self.parse_rrule(rrule_string)

            parts = []

            # Frequency with interval
            freq_label = self.FREQ_LABELS.get(pattern.frequency, pattern.frequency)
            if pattern.interval > 1:
                if pattern.frequency == 'DAILY':
                    parts.append(f"Каждые {pattern.interval} дня")
                elif pattern.frequency == 'WEEKLY':
                    parts.append(f"Каждые {pattern.interval} недели")
                elif pattern.frequency == 'MONTHLY':
                    parts.append(f"Каждые {pattern.interval} месяца")
                elif pattern.frequency == 'YEARLY':
                    parts.append(f"Каждые {pattern.interval} года")
            else:
                parts.append(freq_label)

            # Days of week
            if pattern.by_day:
                days = [self.DAY_LABELS.get(d, d) for d in pattern.by_day]
                parts.append(f"по {', '.join(days)}")

            # Count
            if pattern.count:
                parts.append(f"{pattern.count} раз")

            # Until
            if pattern.until:
                parts.append(f"до {pattern.until.strftime('%d.%m.%Y')}")

            return ', '.join(parts)

        except Exception:
            return rrule_string

    def create_weekly_pattern(
        self,
        days: list[str],
        interval: int = 1,
        count: Optional[int] = None,
        until: Optional[date] = None,
    ) -> str:
        """
        Создание паттерна еженедельного повторения.

        Args:
            days: Дни недели (MO, TU, WE, TH, FR, SA, SU)
            interval: Интервал в неделях
            count: Количество повторений
            until: Повторять до даты

        Returns:
            RRule строка
        """
        pattern = RecurrencePattern(
            frequency='WEEKLY',
            interval=interval,
            by_day=days,
            count=count,
            until=until,
        )
        return self.build_rrule(pattern)

    def create_daily_pattern(
        self,
        interval: int = 1,
        count: Optional[int] = None,
        until: Optional[date] = None,
    ) -> str:
        """
        Создание паттерна ежедневного повторения.

        Args:
            interval: Интервал в днях
            count: Количество повторений
            until: Повторять до даты

        Returns:
            RRule строка
        """
        pattern = RecurrencePattern(
            frequency='DAILY',
            interval=interval,
            count=count,
            until=until,
        )
        return self.build_rrule(pattern)

    def create_monthly_pattern(
        self,
        day_of_month: Optional[int] = None,
        interval: int = 1,
        count: Optional[int] = None,
        until: Optional[date] = None,
    ) -> str:
        """
        Создание паттерна ежемесячного повторения.

        Args:
            day_of_month: День месяца (1-31)
            interval: Интервал в месяцах
            count: Количество повторений
            until: Повторять до даты

        Returns:
            RRule строка
        """
        pattern = RecurrencePattern(
            frequency='MONTHLY',
            interval=interval,
            by_month_day=[day_of_month] if day_of_month else None,
            count=count,
            until=until,
        )
        return self.build_rrule(pattern)
