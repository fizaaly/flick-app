import sys
sys.path.insert(0, r'c:\Users\fizaa\OneDrive\Documents\Flick App\backend')
from app import create_app
from config.database import db
from models.user import User

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='fizaaly750@gmail.com').first()
    if user:
        user.set_password('fiza1234')
        db.session.commit()
        print('Password reset!')
        print('Username:', user.username)
        print('Now login with: fizaaly750@gmail.com / fiza1234')
    else:
        print('User not found')
        all_users = User.query.all()
        print('All users:', [(u.username, u.email) for u in all_users])
