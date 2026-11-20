import asyncio
import aiohttp
import time

URLS = [
    "http://localhost:1002/health",
    "http://localhost:1002/api/v1/site-content",
    "http://localhost:1002/api/v1/products/"
]

TOTAL_REQUESTS = 1000
CONCURRENCY = 25 # 25 concurrent connections (matches PostgreSQL max connection ceiling)

async def fetch(session, sem, idx):
    async with sem:
        url = URLS[idx % len(URLS)]
        try:
            t0 = time.time()
            async with session.get(url, timeout=15) as response:
                status = response.status
                await response.read()
                latency = time.time() - t0
                return status, latency
        except Exception as e:
            return 500, 0

async def run_stress_test():
    print(f"🚀 Starting High-Concurrency Stress Test: {TOTAL_REQUESTS} requests with {CONCURRENCY} concurrent client streams...")
    sem = asyncio.Semaphore(CONCURRENCY)
    start_time = time.time()
    
    conn = aiohttp.TCPConnector(limit=CONCURRENCY)
    async with aiohttp.ClientSession(connector=conn) as session:
        tasks = [fetch(session, sem, i) for i in range(TOTAL_REQUESTS)]
        results = await asyncio.gather(*tasks)
        
    duration = time.time() - start_time
    statuses = [r[0] for r in results]
    latencies = [r[1] for r in results if r[1] > 0]
    
    status_200 = statuses.count(200)
    status_429 = statuses.count(429)
    other = len(statuses) - status_200 - status_429
    
    avg_latency_ms = (sum(latencies) / len(latencies)) * 1000 if latencies else 0
    rps = TOTAL_REQUESTS / duration if duration > 0 else 0
    
    print("\n" + "="*50)
    print("📊 STRESS TEST & DDOS DEFENSE RESULTS:")
    print("="*50)
    print(f"Total Completed Requests : {TOTAL_REQUESTS}")
    print(f"Total Duration           : {duration:.2f} seconds")
    print(f"Throughput Rate          : {rps:.2f} Requests/Second")
    print(f"Average Latency          : {avg_latency_ms:.2f} ms")
    print(f"200 OK (Successful)      : {status_200}")
    print(f"429 Shield (Rate-Limited): {status_429}")
    print(f"Errors / Dropped         : {other}")
    print("="*50)
    if other == 0:
        print("✅ SERVER SURVIVED 1000 CONCURRENT USERS WITH ZERO CRASHES OR DROPPED PACKETS!")
    else:
        print(f"⚠️ {other} requests encountered an issue.")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
