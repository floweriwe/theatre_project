"""
Пример unit теста для проверки инфраструктуры.
"""
import pytest


@pytest.mark.unit
def test_example():
    """Базовый тест для проверки pytest."""
    assert True


@pytest.mark.unit
async def test_async_example():
    """Базовый async тест."""
    assert True
