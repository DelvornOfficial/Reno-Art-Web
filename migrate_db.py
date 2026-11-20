import asyncio
import asyncpg

async def run_migrations():
    conn = await asyncpg.connect("postgresql://postgres:xivam@127.0.0.1:5432/renodesign_db")
    
    print("Applying column updates and indexes...")
    # Add phone column if not exists
    await conn.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) UNIQUE;
    """)
    
    # Add product_images and description_images if not exists
    await conn.execute("""
        ALTER TABLE products ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description_images JSONB DEFAULT '[]'::jsonb;
    """)

    # Create media_gallery table if not exists
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS media_gallery (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255),
            url TEXT NOT NULL,
            media_type VARCHAR(50) DEFAULT 'product_image',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Indexes for 100k simultaneous users
    print("Creating performance indexes...")
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);",
        "CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);",
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);",
        "CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);",
        "CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);",
        "CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);",
        "CREATE INDEX IF NOT EXISTS idx_media_gallery_type ON media_gallery(media_type);"
    ]
    for idx in indexes:
        try:
            await conn.execute(idx)
        except Exception as e:
            print(f"Index notice: {e}")

    print("Database migrations and indexes completed successfully!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migrations())
