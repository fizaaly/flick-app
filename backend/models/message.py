from config.database import db
from datetime import datetime, timezone

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id         = db.Column(db.Integer, primary_key=True)
    user1_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user1    = db.relationship('User', foreign_keys=[user1_id])
    user2    = db.relationship('User', foreign_keys=[user2_id])
    messages = db.relationship('Message', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')

    def other_user(self, my_id):
        return self.user2 if self.user1_id == my_id else self.user1

    def last_message(self):
        return self.messages.order_by(Message.created_at.desc()).first()

    def unread_count(self, user_id):
        return self.messages.filter_by(receiver_id=user_id, is_read=False).count()

    def to_dict(self, my_id):
        other = self.other_user(my_id)
        last  = self.last_message()
        return {
            'id':           self.id,
            'user':         other.to_mini(),
            'last_message': last.to_dict() if last else None,
            'unread':       self.unread_count(my_id),
            'updated_at':   self.updated_at.isoformat(),
        }

    @staticmethod
    def get_or_create(user1_id, user2_id):
        conv = Conversation.query.filter(
            ((Conversation.user1_id == user1_id) & (Conversation.user2_id == user2_id)) |
            ((Conversation.user1_id == user2_id) & (Conversation.user2_id == user1_id))
        ).first()
        if not conv:
            conv = Conversation(user1_id=user1_id, user2_id=user2_id)
            db.session.add(conv)
            db.session.commit()
        return conv


class Message(db.Model):
    __tablename__ = 'messages'

    id              = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    sender_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    receiver_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text            = db.Column(db.Text, default='')
    msg_type        = db.Column(db.String(20), default='text')  # text/image/video/audio/doc/location
    file_url        = db.Column(db.String(300), default='')
    file_name       = db.Column(db.String(200), default='')
    file_size       = db.Column(db.Integer, default=0)
    latitude        = db.Column(db.Float, nullable=True)
    longitude       = db.Column(db.Float, nullable=True)
    is_read         = db.Column(db.Boolean, default=False)
    reaction        = db.Column(db.String(10), default='')
    created_at      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    receiver = db.relationship('User', foreign_keys=[receiver_id])

    def to_dict(self):
        url = self.file_url
        if url and not url.startswith('http'):
            url = f'/api/uploads/{url}'
        return {
            'id':         self.id,
            'sender_id':  self.sender_id,
            'receiver_id':self.receiver_id,
            'text':       self.text,
            'type':       self.msg_type,
            'file_url':   url,
            'file_name':  self.file_name,
            'file_size':  self.file_size,
            'latitude':   self.latitude,
            'longitude':  self.longitude,
            'is_read':    self.is_read,
            'reaction':   self.reaction,
            'created_at': self.created_at.isoformat(),
        }
