from database.connection import SessionLocal, engine
from database.models import Movie, Rating, User, MovieLink, Base
from data_processing.data_loader import DataLoader
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def clean_database():
    session = SessionLocal()
    try:
        logger.info("🧹 Curățarea bazei de date...")

        session.query(Rating).delete()
        session.query(MovieLink).delete()
        session.query(Movie).delete()
        session.query(User).delete()

        session.commit()
        logger.info("✓ Baza de date a fost curățată")

    except Exception as e:
        session.rollback()
        logger.error(f"❌ Eroare la curățarea bazei de date: {str(e)}")
        raise
    finally:
        session.close()


def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tabelele au fost create/verificate")
    except Exception as e:
        logger.error(f"❌ Eroare la crearea tabelelor: {str(e)}")
        raise


def reload_data():
    loader = DataLoader("../ml-latest-small")
    try:
        logger.info("📥 Început încărcare date...")
        success = loader.load_and_save_all()

        if success:
            logger.info("✓ Datele au fost încărcate cu succes!")
        else:
            logger.error("❌ Eroare la încărcarea datelor")

        return success
    except Exception as e:
        logger.error(f"❌ Eroare la încărcare: {str(e)}")
        return False
    finally:
        loader.close()


def main():
    logger.info("=== CURĂȚARE ȘI REÎNCĂRCARE DATE ===")

    try:

        clean_database()
        create_tables()
        reload_data()

        logger.info("✅ Operațiune completă!")

    except Exception as e:
        logger.error(f"❌ Eroare generală: {str(e)}")


if __name__ == "__main__":
    main()