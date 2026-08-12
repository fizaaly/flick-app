import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from dotenv import load_dotenv
from config.database import db, init_db
from datetime import timedelta

load_dotenv()

# ── CREATE APP ─────────────────────────────────────
def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY']                  = os.getenv('SECRET_KEY', 'flick-secret')
    app.config['JWT_SECRET_KEY']              = os.getenv('JWT_SECRET_KEY', 'flick-jwt-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES']    = timedelta(days=7)
    app.config['JWT_REFRESH_TOKEN_EXPIRES']   = timedelta(days=30)
    app.config['SQLALCHEMY_DATABASE_URI']     = 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'flick.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER']               = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config['MAX_CONTENT_LENGTH']          = 50 * 1024 * 1024  # 50MB

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Extensions - allow all origins
    CORS(app,
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=False,
         allow_headers=["Content-Type","Authorization"],
         methods=["GET","POST","PUT","DELETE","OPTIONS"]
    )
    JWTManager(app)
    init_db(app)

    # Import ALL models first so db.create_all() knows about them
    with app.app_context():
        from models.user    import User
        from models.follow  import Follow
        from models.post    import Post, PostImage, Like, Comment, SavedPost
        from models.message import Message, Conversation
        from models.story   import Story, StoryView
        db.create_all()
        print("  ✅ Database tables created/verified")

    # Blueprints
    from routes.auth     import auth_bp
    from routes.posts    import posts_bp
    from routes.messages import messages_bp
    from routes.stories  import stories_bp
    from routes.users    import users_bp

    app.register_blueprint(auth_bp,     url_prefix='/api/auth')
    app.register_blueprint(posts_bp,    url_prefix='/api/posts')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(stories_bp,  url_prefix='/api/stories')
    app.register_blueprint(users_bp,    url_prefix='/api/users')

    # Serve uploaded files
    @app.route('/api/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'app': 'Flick API'}), 200

    # Serve frontend
    frontend = os.path.join(os.path.dirname(__file__), '..', 'frontend')

    @app.route('/')
    @app.route('/<path:path>')
    def serve_frontend(path='index.html'):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        target = os.path.join(frontend, path)
        if os.path.isfile(target):
            return send_from_directory(frontend, path)
        return send_from_directory(frontend, 'index.html')

    # JWT error handlers
    @app.errorhandler(422)
    def handle_422(e):
        return jsonify({'error': 'Unprocessable request'}), 422

    return app


app    = create_app()
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ══════════════════════════════════════════
#  REAL-TIME SOCKET.IO EVENTS
# ══════════════════════════════════════════
online_users = {}   # {user_id: socket_id}

@socketio.on('connect')
def on_connect(auth):
    try:
        token   = (auth or {}).get('token', '')
        decoded = decode_token(token)
        user_id = int(decoded['sub'])
        online_users[user_id] = request.sid
        join_room(f'user_{user_id}')
        emit('connected', {'user_id': user_id})
        print(f'User {user_id} connected')
    except Exception:
        pass   # unauthenticated connect ignored

@socketio.on('disconnect')
def on_disconnect():
    uid = next((k for k, v in online_users.items() if v == request.sid), None)
    if uid:
        del online_users[uid]
        # Mark offline in DB
        with app.app_context():
            from models.user import User
            from config.database import db
            from datetime import datetime, timezone
            user = User.query.get(uid)
            if user:
                user.is_online = False
                user.last_seen = datetime.now(timezone.utc)
                db.session.commit()

@socketio.on('join_chat')
def on_join_chat(data):
    room = f"conv_{data.get('conversation_id')}"
    join_room(room)

@socketio.on('leave_chat')
def on_leave_chat(data):
    room = f"conv_{data.get('conversation_id')}"
    leave_room(room)

@socketio.on('new_message')
def on_new_message(data):
    """
    Frontend sends: { conversation_id, message_data }
    We broadcast to everyone in that conv room
    """
    room = f"conv_{data.get('conversation_id')}"
    emit('receive_message', data.get('message_data'), room=room, include_self=False)

@socketio.on('typing')
def on_typing(data):
    room = f"conv_{data.get('conversation_id')}"
    emit('user_typing', {
        'user_id': data.get('user_id'),
        'typing':  data.get('typing', True)
    }, room=room, include_self=False)

@socketio.on('message_read')
def on_message_read(data):
    room = f"conv_{data.get('conversation_id')}"
    emit('messages_read', {'reader_id': data.get('user_id')}, room=room, include_self=False)


# ── IMPORT request after app creation
from flask import request

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    print('\n' + '='*50)
    print(f'  FLICK APP - Running at http://localhost:{port}')
    print('='*50 + '\n')
    socketio.run(app, host='0.0.0.0', port=port, debug=debug, use_reloader=False)
