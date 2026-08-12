from config.database import db
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(100), nullable=False)
    username      = db.Column(db.String(50), unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    bio           = db.Column(db.String(300), default='')
    avatar        = db.Column(db.String(300), default='')
    cover         = db.Column(db.String(300), default='')
    is_verified   = db.Column(db.Boolean, default=False)
    is_private    = db.Column(db.Boolean, default=False)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_online     = db.Column(db.Boolean, default=False)

    # Relationships
    posts         = db.relationship('Post', backref='author', lazy='dynamic', foreign_keys='Post.user_id')
    stories       = db.relationship('Story', backref='author', lazy='dynamic')
    sent_messages = db.relationship('Message', backref='sender', lazy='dynamic', foreign_keys='Message.sender_id')
    comments      = db.relationship('Comment', backref='author', lazy='dynamic')
    likes         = db.relationship('Like', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def followers_count(self):
        from models.follow import Follow
        return Follow.query.filter_by(followed_id=self.id).count()

    def following_count(self):
        from models.follow import Follow
        return Follow.query.filter_by(follower_id=self.id).count()

    def posts_count(self):
        return self.posts.count()

    def is_followed_by(self, user_id):
        from models.follow import Follow
        return Follow.query.filter_by(follower_id=user_id, followed_id=self.id).first() is not None

    def avatar_url(self):
        if self.avatar and self.avatar.startswith('http'):
            return self.avatar
        if self.avatar:
            return f'/api/uploads/{self.avatar}'
        return f'https://ui-avatars.com/api/?name={self.name.replace(" ", "+")}&background=7C3AED&color=fff&size=150'

    def to_dict(self, current_user_id=None):
        return {
            'id':          self.id,
            'name':        self.name,
            'username':    self.username,
            'email':       self.email,
            'bio':         self.bio,
            'avatar':      self.avatar_url(),
            'cover':       self.cover,
            'is_verified': self.is_verified,
            'is_private':  self.is_private,
            'is_online':   self.is_online,
            'last_seen':   self.last_seen.isoformat() if self.last_seen else None,
            'created_at':  self.created_at.isoformat() if self.created_at else None,
            'followers':   self.followers_count(),
            'following':   self.following_count(),
            'posts_count': self.posts_count(),
            'is_following': self.is_followed_by(current_user_id) if current_user_id else False,
        }

    def to_mini(self):
        return {
            'id':          self.id,
            'name':        self.name,
            'username':    self.username,
            'avatar':      self.avatar_url(),
            'is_verified': self.is_verified,
            'is_online':   self.is_online,
        }
