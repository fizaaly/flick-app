from config.database import db
from datetime import datetime, timezone, timedelta

class Story(db.Model):
    __tablename__ = 'stories'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    media_url  = db.Column(db.String(300), nullable=False)
    media_type = db.Column(db.String(10), default='image')  # image/video
    caption    = db.Column(db.String(300), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

    views = db.relationship('StoryView', backref='story', lazy='dynamic', cascade='all, delete-orphan')

    def is_expired(self):
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    def view_count(self):
        return self.views.count()

    def is_viewed_by(self, user_id):
        return StoryView.query.filter_by(story_id=self.id, viewer_id=user_id).first() is not None

    def media_full_url(self):
        if self.media_url.startswith('http'):
            return self.media_url
        return f'/api/uploads/{self.media_url}'

    def to_dict(self, current_user_id=None):
        return {
            'id':         self.id,
            'user':       self.author.to_mini(),
            'media_url':  self.media_full_url(),
            'media_type': self.media_type,
            'caption':    self.caption,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'views':      self.view_count(),
            'seen':       self.is_viewed_by(current_user_id) if current_user_id else False,
        }


class StoryView(db.Model):
    __tablename__ = 'story_views'

    id         = db.Column(db.Integer, primary_key=True)
    story_id   = db.Column(db.Integer, db.ForeignKey('stories.id'), nullable=False)
    viewer_id  = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint('story_id', 'viewer_id'),)
