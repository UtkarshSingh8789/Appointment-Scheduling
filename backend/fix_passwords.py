import asyncio
from app.core.database import async_session_maker
from app.models.user import User
from sqlalchemy import select, update
from app.core.security import hash_password

async def fix_passwords():
    admin_pass = hash_password("Admin@2024")
    demo_pass = hash_password("Demo@1234")
    
    async with async_session_maker() as session:
        # Update admin
        await session.execute(
            update(User)
            .where(User.email == 'admin@appointly.com')
            .values(password_hash=admin_pass)
        )
        # Update everyone else
        await session.execute(
            update(User)
            .where(User.email != 'admin@appointly.com')
            .values(password_hash=demo_pass)
        )
        await session.commit()
        print("Passwords updated successfully!")

if __name__ == "__main__":
    asyncio.run(fix_passwords())
