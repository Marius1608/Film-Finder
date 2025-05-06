from database.connection import engine, SessionLocal
from database.models import Base
from sqlalchemy import text
import traceback


def test_database_connection():
    try:
        with engine.connect() as connection:
            print("✓ Conexiune cu succes la baza de date!")

        Base.metadata.create_all(bind=engine)
        print("✓ Tabelele au fost create/verificate cu succes!")

        session = SessionLocal()
        try:
            result = session.execute(text("SELECT 1"))
            print(f"✓ Test interogare: {result.scalar()}")
        finally:
            session.close()

        print("\n✅ Toate testele au trecut cu succes!")

    except Exception as e:
        print(f"❌ Eroare: {str(e)}")
        print(traceback.format_exc())


if __name__ == "__main__":
    test_database_connection()