import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect("postgresql://postgres:xivam@127.0.0.1:5432/postgres")
    val = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = 'renodesign_db'")
    if not val:
        await conn.execute("CREATE DATABASE renodesign_db")
        print("Created renodesign_db")
    else:
        print("renodesign_db exists")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check())
