from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from config.database import db
from models.user import User
from datetime import timezone, datetime
import re

auth_bp = Blueprint('auth', __name__)

def valid_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email)

def valid_username(u):
    return re.match(r'^[a-zA-Z0-9._]{3,30}$', u)

# ── REGISTER ──────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    name     = (data.get('name')     or '').strip()
    username = (data.get('username') or '').strip().lower()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not all([name, username, email, password]):
        return jsonify({'error': 'All fields are required'}), 400
    if len(name) < 2:
        return jsonify({'error': 'Name must be at least 2 characters'}), 400
    if not valid_username(username):
        return jsonify({'error': 'Username must be 3-30 chars, only letters/numbers/._'}), 400
    if not valid_email(email):
        return jsonify({'error': 'Invalid email address'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(name=name, username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message':       'Account created successfully',
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user':          user.to_dict()
    }), 201

# ── LOGIN ──────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data     = request.get_json()
    login_id = (data.get('username') or data.get('email') or '').strip().lower()
    password = (data.get('password') or '').strip()

    if not login_id or not password:
        return jsonify({'error': 'Username/email and password required'}), 400

    user = User.query.filter(
        (User.username == login_id) | (User.email == login_id)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    user.is_online  = True
    user.last_seen  = datetime.now(timezone.utc)
    db.session.commit()

    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'message':       'Login successful',
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user':          user.to_dict()
    }), 200

# ── REFRESH TOKEN ──────────────────────────────────
@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token}), 200

# ── LOGOUT ─────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if user:
        user.is_online = False
        user.last_seen = datetime.now(timezone.utc)
        db.session.commit()
    return jsonify({'message': 'Logged out'}), 200

# ── GET CURRENT USER ───────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict(user_id)}), 200

# ── UPDATE PROFILE ─────────────────────────────────
@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'bio' in data:
        user.bio = data['bio'].strip()[:300]
    if 'is_private' in data:
        user.is_private = bool(data['is_private'])

    # Change password
    if data.get('new_password'):
        if not data.get('current_password'):
            return jsonify({'error': 'Current password required'}), 400
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is wrong'}), 401
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        user.set_password(data['new_password'])

    db.session.commit()
    return jsonify({'user': user.to_dict(user_id)}), 200
