from config.database import db
from datetime import datetime, timezone

class Post(db.Model):
    __tablename__ = 'posts'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    caption    = db.Column(db.Text, default='')
    location   = db.Column(db.String(200), default='')
    audience   = db.Column(db.String(20), default='public')  # public/friends/private
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    images   = db.relationship('PostImage', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    likes    = db.relationship('Like', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')

    def likes_count(self):
        return self.likes.count()

    def comments_count(self):
        return self.comments.count()

    def is_liked_by(self, user_id):
        return Like.query.filter_by(post_id=self.id, user_id=user_id).first() is not None

    def is_saved_by(self, user_id):
        return SavedPost.query.filter_by(post_id=self.id, user_id=user_id).first() is not None

    def to_dict(self, current_user_id=None):
        return {
            'id':         self.id,
            'user':       self.author.to_mini(),
            'caption':    self.caption,
            'location':   self.location,
            'audience':   self.audience,
            'images':     [img.to_dict() for img in self.images],
            'likes':      self.likes_count(),
            'comments':   self.comments_count(),
            'created_at': self.created_at.isoformat(),
            'is_liked':   self.is_liked_by(current_user_id) if current_user_id else False,
            'is_saved':   self.is_saved_by(current_user_id) if current_user_id else False,
        }


class PostImage(db.Model):
    __tablename__ = 'post_images'

    id       = db.Column(db.Integer, primary_key=True)
    post_id  = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    filename = db.Column(db.String(300), nullable=False)
    order    = db.Column(db.Integer, default=0)

    def url(self):
        if self.filename.startswith('http'):
            return self.filename
        return f'/api/uploads/{self.filename}'

    def to_dict(self):
        return {'id': self.id, 'url': self.url(), 'order': self.order}


class Like(db.Model):
    __tablename__ = 'likes'

    id         = db.Column(db.Integer, primary_key=True)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('post_id', 'user_id'),)


class Comment(db.Model):
    __tablename__ = 'comments'

    id         = db.Column(db.Integer, primary_key=True)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text       = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id':         self.id,
            'user':       self.author.to_mini(),
            'text':       self.text,
            'created_at': self.created_at.isoformat(),
        }


class SavedPost(db.Model):
    __tablename__ = 'saved_posts'

    id         = db.Column(db.Integer, primary_key=True)
    post_id    = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('post_id', 'user_id'),)
