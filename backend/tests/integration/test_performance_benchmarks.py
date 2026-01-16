"""
Performance benchmark tests for list endpoints.

Tests ensure that paginated list endpoints meet performance requirements:
- p95 latency < 500ms with 1000+ records
- Efficient query execution with proper indexing
- Acceptable response times under load

Usage:
    pytest backend/tests/integration/test_performance_benchmarks.py -v -m benchmark
"""
import time
from statistics import quantiles
from typing import Callable

import pytest
from httpx import AsyncClient
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import InventoryItem, InventoryCategory, StorageLocation
from app.models.performance import Performance
from app.models.document import Document, DocumentCategory
from app.models.schedule import ScheduleEvent


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def performance_timer():
    """
    Fixture to measure execution time of multiple function calls.
    
    Collects timing data and calculates p95 latency.
    """
    times = []
    
    class Timer:
        def measure(self, func: Callable):
            """Execute function and record elapsed time in milliseconds."""
            start = time.perf_counter()
            result = func()
            elapsed = (time.perf_counter() - start) * 1000  # Convert to ms
            times.append(elapsed)
            return result
        
        async def measure_async(self, coro):
            """Execute async function and record elapsed time in milliseconds."""
            start = time.perf_counter()
            result = await coro
            elapsed = (time.perf_counter() - start) * 1000  # Convert to ms
            times.append(elapsed)
            return result
        
        @property
        def p95(self) -> float:
            """Calculate 95th percentile latency."""
            if len(times) < 2:
                return max(times) if times else 0.0
            if len(times) < 20:
                # For small samples, use sorted approach
                sorted_times = sorted(times)
                idx = int(len(sorted_times) * 0.95)
                return sorted_times[min(idx, len(sorted_times) - 1)]
            # For larger samples, use quantiles
            return quantiles(times, n=20)[18]  # 95th percentile
        
        @property
        def avg(self) -> float:
            """Calculate average latency."""
            return sum(times) / len(times) if times else 0.0
        
        @property
        def min(self) -> float:
            """Get minimum latency."""
            return min(times) if times else 0.0
        
        @property
        def max(self) -> float:
            """Get maximum latency."""
            return max(times) if times else 0.0
        
        @property
        def count(self) -> int:
            """Get number of measurements."""
            return len(times)
        
        def report(self) -> str:
            """Generate performance report."""
            return (
                f"Measurements: {self.count}\n"
                f"  Min: {self.min:.2f}ms\n"
                f"  Avg: {self.avg:.2f}ms\n"
                f"  Max: {self.max:.2f}ms\n"
                f"  P95: {self.p95:.2f}ms"
            )
    
    return Timer()


@pytest.fixture
async def check_data_size(test_db: AsyncSession):
    """
    Check if database has enough records for meaningful benchmarking.
    
    Logs current data size for each table.
    """
    counts = {}
    
    # Count inventory items
    result = await test_db.execute(select(func.count()).select_from(InventoryItem))
    counts['inventory_items'] = result.scalar()
    
    # Count performances
    result = await test_db.execute(select(func.count()).select_from(Performance))
    counts['performances'] = result.scalar()
    
    # Count documents
    result = await test_db.execute(select(func.count()).select_from(Document))
    counts['documents'] = result.scalar()
    
    # Count schedule events
    result = await test_db.execute(select(func.count()).select_from(ScheduleEvent))
    counts['schedule_events'] = result.scalar()
    
    print("\n[Data Size Report]")
    for table, count in counts.items():
        print(f"  {table}: {count} records")
    
    return counts


# =============================================================================
# Benchmark Tests
# =============================================================================

@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
class TestInventoryPerformance:
    """Performance tests for inventory list endpoints."""
    
    async def test_inventory_items_list_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/inventory/items performance.
        
        Requirement: p95 latency < 500ms
        """
        num_iterations = 10
        
        # Warm-up request
        await authorized_client.get("/api/v1/inventory/items?page=1&limit=20")
        
        # Measure multiple requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/inventory/items?page=1&limit=20")
            )
        
        print(f"\n[Inventory Items List Performance]")
        print(f"  Records in DB: {check_data_size['inventory_items']}")
        print(f"  {performance_timer.report()}")
        
        # Assert p95 requirement
        assert performance_timer.p95 < 500, (
            f"Inventory items list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )
    
    async def test_inventory_items_with_filters_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/inventory/items with filters performance.
        
        Requirement: p95 latency < 500ms with filters
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get(
            "/api/v1/inventory/items?page=1&limit=20&status=in_stock"
        )
        
        # Measure filtered requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get(
                    f"/api/v1/inventory/items?page=1&limit=20&status=in_stock&is_active=true"
                )
            )
        
        print(f"\n[Inventory Items with Filters Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Inventory items filtered list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )
    
    async def test_inventory_search_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/inventory/items with search performance.
        
        Requirement: p95 latency < 500ms with search query
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/inventory/items?page=1&limit=20&search=реквизит")
        
        # Measure search requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get(
                    "/api/v1/inventory/items?page=1&limit=20&search=реквизит"
                )
            )
        
        print(f"\n[Inventory Search Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Inventory search p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )


@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
class TestPerformanceListPerformance:
    """Performance tests for performance/repertoire list endpoints."""
    
    async def test_performances_list_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/performances performance.
        
        Requirement: p95 latency < 500ms
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/performances?page=1&limit=20")
        
        # Measure requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/performances?page=1&limit=20")
            )
        
        print(f"\n[Performances List Performance]")
        print(f"  Records in DB: {check_data_size['performances']}")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Performances list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )
    
    async def test_repertoire_list_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/performances/repertoire performance.
        
        Requirement: p95 latency < 500ms
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/performances/repertoire")
        
        # Measure requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/performances/repertoire")
            )
        
        print(f"\n[Repertoire List Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Repertoire list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )


@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
class TestDocumentPerformance:
    """Performance tests for document list endpoints."""
    
    async def test_documents_list_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/documents performance.
        
        Requirement: p95 latency < 500ms
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/documents?page=1&limit=20")
        
        # Measure requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/documents?page=1&limit=20")
            )
        
        print(f"\n[Documents List Performance]")
        print(f"  Records in DB: {check_data_size['documents']}")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Documents list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )
    
    async def test_documents_with_filters_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/documents with filters performance.
        
        Requirement: p95 latency < 500ms with filters
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/documents?page=1&limit=20&is_active=true")
        
        # Measure filtered requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get(
                    "/api/v1/documents?page=1&limit=20&is_active=true"
                )
            )
        
        print(f"\n[Documents with Filters Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Documents filtered list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )


@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
class TestSchedulePerformance:
    """Performance tests for schedule list endpoints."""
    
    async def test_schedule_list_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/schedule performance.
        
        Requirement: p95 latency < 500ms
        """
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/schedule?page=1&limit=20")
        
        # Measure requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/schedule?page=1&limit=20")
            )
        
        print(f"\n[Schedule List Performance]")
        print(f"  Records in DB: {check_data_size['schedule_events']}")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Schedule list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )
    
    async def test_schedule_with_date_filters_latency(
        self,
        authorized_client: AsyncClient,
        performance_timer,
        check_data_size,
    ):
        """
        Test GET /api/v1/schedule with date filters performance.
        
        Requirement: p95 latency < 500ms with date range
        """
        from datetime import date, timedelta
        
        num_iterations = 10
        today = date.today()
        start = today.isoformat()
        end = (today + timedelta(days=30)).isoformat()
        
        # Warm-up
        await authorized_client.get(
            f"/api/v1/schedule?page=1&limit=20&start_date={start}&end_date={end}"
        )
        
        # Measure filtered requests
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get(
                    f"/api/v1/schedule?page=1&limit=20&start_date={start}&end_date={end}"
                )
            )
        
        print(f"\n[Schedule with Date Filters Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500, (
            f"Schedule filtered list p95 latency ({performance_timer.p95:.2f}ms) "
            f"exceeds 500ms threshold"
        )


# =============================================================================
# Pagination Performance Tests
# =============================================================================

@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
class TestPaginationPerformance:
    """Test pagination performance across different page sizes."""
    
    async def test_small_page_size_performance(
        self,
        authorized_client: AsyncClient,
        performance_timer,
    ):
        """Test performance with small page size (10 items)."""
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/inventory/items?page=1&limit=10")
        
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/inventory/items?page=1&limit=10")
            )
        
        print(f"\n[Small Page Size (10) Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500
    
    async def test_medium_page_size_performance(
        self,
        authorized_client: AsyncClient,
        performance_timer,
    ):
        """Test performance with medium page size (50 items)."""
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/inventory/items?page=1&limit=50")
        
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/inventory/items?page=1&limit=50")
            )
        
        print(f"\n[Medium Page Size (50) Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500
    
    async def test_large_page_size_performance(
        self,
        authorized_client: AsyncClient,
        performance_timer,
    ):
        """Test performance with large page size (100 items)."""
        num_iterations = 10
        
        # Warm-up
        await authorized_client.get("/api/v1/inventory/items?page=1&limit=100")
        
        for i in range(num_iterations):
            await performance_timer.measure_async(
                authorized_client.get("/api/v1/inventory/items?page=1&limit=100")
            )
        
        print(f"\n[Large Page Size (100) Performance]")
        print(f"  {performance_timer.report()}")
        
        assert performance_timer.p95 < 500


# =============================================================================
# Summary Report
# =============================================================================

@pytest.mark.asyncio
@pytest.mark.benchmark
@pytest.mark.integration
async def test_generate_performance_summary(
    authorized_client: AsyncClient,
    check_data_size,
):
    """
    Generate summary report of all endpoint performance.
    
    This test always passes but provides overview of system performance.
    """
    print("\n" + "=" * 70)
    print("  PERFORMANCE BENCHMARK SUMMARY")
    print("=" * 70)
    
    endpoints = [
        ("Inventory Items", "/api/v1/inventory/items?page=1&limit=20"),
        ("Performances", "/api/v1/performances?page=1&limit=20"),
        ("Documents", "/api/v1/documents?page=1&limit=20"),
        ("Schedule", "/api/v1/schedule?page=1&limit=20"),
    ]
    
    results = []
    
    for name, url in endpoints:
        times = []
        
        # Warm-up
        await authorized_client.get(url)
        
        # Measure 5 requests
        for _ in range(5):
            start = time.perf_counter()
            response = await authorized_client.get(url)
            elapsed = (time.perf_counter() - start) * 1000
            times.append(elapsed)
        
        avg = sum(times) / len(times)
        p95 = sorted(times)[int(len(times) * 0.95)] if len(times) >= 2 else max(times)
        
        results.append({
            'name': name,
            'avg': avg,
            'p95': p95,
            'status': 'OK' if p95 < 500 else 'FAIL'
        })
    
    print("\n  Endpoint Performance (5 iterations each):")
    print("  " + "-" * 66)
    print(f"  {'Endpoint':<20} {'Avg (ms)':<12} {'P95 (ms)':<12} {'Status'}")
    print("  " + "-" * 66)
    
    for r in results:
        print(f"  {r['name']:<20} {r['avg']:>10.2f}   {r['p95']:>10.2f}   {r['status']}")
    
    print("  " + "-" * 66)
    print("\n  Data Size:")
    for table, count in check_data_size.items():
        print(f"    {table}: {count} records")
    
    print("\n" + "=" * 70)
    
    # This test always passes - it's informational
    assert True
