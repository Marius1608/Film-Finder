from database.connection import SessionLocal
from database.models import UserApplication
from auth.auth import get_password_hash


def add_user(email, password, first_name, last_name):
    session = SessionLocal()
    try:
        existing_user = session.query(UserApplication).filter(
            UserApplication.email == email
        ).first()

        if existing_user:
            print(f"User {email} already exists!")
            return None

        hashed_password = get_password_hash(password)

        new_user = UserApplication(
            email=email,
            password_hash=hashed_password,
            first_name=first_name,
            last_name=last_name
        )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

        print(f"User {email} created successfully with ID: {new_user.id}")
        return new_user

    except Exception as e:
        session.rollback()
        print(f"Error creating user: {e}")
        return None
    finally:
        session.close()


if __name__ == "__main__":
    add_user(
        email="admin@filmfinder.com",
        password="admin123",
        first_name="Admin",
        last_name="User"
    )