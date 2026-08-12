from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.database import db
from models.message import Message, Conversation
from models.user import User
import os, uuid
from werkzeug.utils import secure_filename

messages_bp = Blueprint('messages', __name__)

ALLOWED_MSG = {'png','jpg','jpeg','gif','webp','mp4','mov','mp3','wav','ogg',
               'pdf','doc','docx','xls','xlsx','ppt','pptx','txt','zip','rar'}

def allowed_msg_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_MSG

def save_msg_file(file):
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"msg_{uuid.uuid4().hex}.{ext}"
    path     = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(path)
    return filename

# ── GET ALL CONVERSATIONS ──────────────────────────
@messages_bp.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())
    convs = Conversation.query.filter(
        (Conversation.user1_id == user_id) | (Conversation.user2_id == user_id)
    ).order_by(Conversation.updated_at.desc()).all()

    return jsonify({
        'conversations': [c.to_dict(user_id) for c in convs]
    }), 200

# ── GET OR START CONVERSATION ──────────────────────
@messages_bp.route('/conversations/<int:other_id>', methods=['GET'])
@jwt_required()
def get_conversation(other_id):
    user_id = int(get_jwt_identity())
    other   = User.query.get_or_404(other_id)
    conv    = Conversation.get_or_create(user_id, other_id)

    page     = request.args.get('page', 1, type=int)
    per_page = 30
    msgs = Message.query.filter_by(conversation_id=conv.id)\
        .order_by(Message.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    # Mark received messages as read
    Message.query.filter_by(
        conversation_id=conv.id,
        receiver_id=user_id,
        is_read=False
    ).update({'is_read': True})
    db.session.commit()

    return jsonify({
        'conversation': conv.to_dict(user_id),
        'messages':     [m.to_dict() for m in reversed(msgs.items)],
        'has_more':     msgs.has_next,
    }), 200

# ── SEND MESSAGE (text) ────────────────────────────
@messages_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    receiver_id = data.get('receiver_id')
    text        = (data.get('text') or '').strip()
    lat         = data.get('latitude')
    lng         = data.get('longitude')
    msg_type    = data.get('type', 'text')

    if not receiver_id:
        return jsonify({'error': 'receiver_id required'}), 400
    if not text and msg_type == 'text':
        return jsonify({'error': 'Message cannot be empty'}), 400

    receiver = User.query.get_or_404(receiver_id)
    conv     = Conversation.get_or_create(user_id, receiver_id)

    msg = Message(
        conversation_id=conv.id,
        sender_id=user_id,
        receiver_id=receiver_id,
        text=text,
        msg_type=msg_type,
        latitude=lat,
        longitude=lng,
    )
    db.session.add(msg)

    # Update conversation timestamp
    from datetime import datetime, timezone
    conv.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({'message': msg.to_dict()}), 201

# ── SEND FILE (image/video/audio/doc) ─────────────
@messages_bp.route('/send-file', methods=['POST'])
@jwt_required()
def send_file_msg():
    user_id     = int(get_jwt_identity())
    receiver_id = request.form.get('receiver_id', type=int)
    caption     = request.form.get('caption', '').strip()
    file        = request.files.get('file')

    if not receiver_id or not file:
        return jsonify({'error': 'receiver_id and file required'}), 400
    if not allowed_msg_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = save_msg_file(file)
    size     = os.path.getsize(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))

    if ext in {'png','jpg','jpeg','gif','webp'}:   msg_type = 'image'
    elif ext in {'mp4','mov'}:                      msg_type = 'video'
    elif ext in {'mp3','wav','ogg'}:                msg_type = 'audio'
    else:                                           msg_type = 'doc'

    User.query.get_or_404(receiver_id)
    conv = Conversation.get_or_create(user_id, receiver_id)

    msg = Message(
        conversation_id=conv.id,
        sender_id=user_id,
        receiver_id=receiver_id,
        text=caption,
        msg_type=msg_type,
        file_url=filename,
        file_name=file.filename,
        file_size=size,
    )
    db.session.add(msg)

    from datetime import datetime, timezone
    conv.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({'message': msg.to_dict()}), 201

# ── ADD REACTION TO MESSAGE ────────────────────────
@messages_bp.route('/<int:msg_id>/react', methods=['POST'])
@jwt_required()
def react_message(msg_id):
    user_id = int(get_jwt_identity())
    msg     = Message.query.get_or_404(msg_id)
    if msg.sender_id != user_id and msg.receiver_id != user_id:
        return jsonify({'error': 'Not allowed'}), 403

    data     = request.get_json()
    emoji    = data.get('emoji', '')
    msg.reaction = '' if msg.reaction == emoji else emoji
    db.session.commit()
    return jsonify({'reaction': msg.reaction}), 200

# ── DELETE MESSAGE ─────────────────────────────────
@messages_bp.route('/<int:msg_id>', methods=['DELETE'])
@jwt_required()
def delete_message(msg_id):
    user_id = int(get_jwt_identity())
    msg     = Message.query.get_or_404(msg_id)
    if msg.sender_id != user_id:
        return jsonify({'error': 'Not your message'}), 403
    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ── MARK READ ──────────────────────────────────────
@messages_bp.route('/conversations/<int:conv_id>/read', methods=['POST'])
@jwt_required()
def mark_read(conv_id):
    user_id = int(get_jwt_identity())
    Message.query.filter_by(
        conversation_id=conv_id,
        receiver_id=user_id,
        is_read=False
    ).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200
