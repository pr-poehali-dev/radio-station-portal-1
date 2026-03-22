"""Авторизация и регистрация пользователей"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = 't_p56117371_radio_station_portal'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400'
}


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    salt = 'radiorussia_salt_2024'
    return hashlib.sha256((password + salt).encode()).hexdigest()


def handler(event: dict, context) -> dict:
    """Обработчик авторизации: регистрация, вход, выход, получение профиля"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    try:
        if method == 'POST' and '/register' in path:
            return register(event)
        elif method == 'POST' and '/login' in path:
            return login(event)
        elif method == 'POST' and '/logout' in path:
            return logout(event)
        elif method == 'GET' and '/me' in path:
            return get_me(event)
        elif method == 'PUT' and '/profile' in path:
            return update_profile(event)
        else:
            return {'statusCode': 404, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Not found'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS_HEADERS, 'body': json.dumps({'error': str(e)})}


def register(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    username = body.get('username', '').strip()
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not username or not email or not password:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}
    if len(password) < 6:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пароль минимум 6 символов'})}

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s OR username = %s", (email, username))
        if cur.fetchone():
            return {'statusCode': 409, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Пользователь уже существует'})}

        password_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (username, email, password_hash, role) VALUES (%s, %s, %s, 'user') RETURNING id, username, email, role, created_at",
            (username, email, password_hash)
        )
        user = cur.fetchone()
        session_id = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user[0])
        )
        conn.commit()
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'session_id': session_id,
                'user': {'id': user[0], 'username': user[1], 'email': user[2], 'role': user[3]}
            })
        }
    finally:
        cur.close()
        conn.close()


def login(event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')

    if not email or not password:
        return {'statusCode': 400, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Введите email и пароль'})}

    conn = get_db()
    cur = conn.cursor()
    try:
        password_hash = hash_password(password)
        cur.execute(
            f"SELECT id, username, email, role, avatar_url FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s",
            (email, password_hash)
        )
        user = cur.fetchone()
        if not user:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        session_id = secrets.token_hex(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.sessions (id, user_id) VALUES (%s, %s)",
            (session_id, user[0])
        )
        conn.commit()
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'session_id': session_id,
                'user': {'id': user[0], 'username': user[1], 'email': user[2], 'role': user[3], 'avatar_url': user[4]}
            })
        }
    finally:
        cur.close()
        conn.close()


def logout(event: dict) -> dict:
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')
    if not session_id:
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}
    finally:
        cur.close()
        conn.close()


def get_me(event: dict) -> dict:
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')
    if not session_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"""SELECT u.id, u.username, u.email, u.role, u.avatar_url, u.created_at
                FROM {SCHEMA}.users u
                JOIN {SCHEMA}.sessions s ON s.user_id = u.id
                WHERE s.id = %s AND s.expires_at > NOW()""",
            (session_id,)
        )
        user = cur.fetchone()
        if not user:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Сессия истекла'})}

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'user': {
                    'id': user[0], 'username': user[1], 'email': user[2],
                    'role': user[3], 'avatar_url': user[4],
                    'created_at': str(user[5])
                }
            })
        }
    finally:
        cur.close()
        conn.close()


def update_profile(event: dict) -> dict:
    headers = event.get('headers', {})
    session_id = headers.get('X-Session-Id', '')
    if not session_id:
        return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

    body = json.loads(event.get('body', '{}'))
    username = body.get('username', '').strip()

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT user_id FROM {SCHEMA}.sessions WHERE id = %s AND expires_at > NOW()", (session_id,))
        session = cur.fetchone()
        if not session:
            return {'statusCode': 401, 'headers': CORS_HEADERS, 'body': json.dumps({'error': 'Не авторизован'})}

        if username:
            cur.execute(f"UPDATE {SCHEMA}.users SET username = %s, updated_at = NOW() WHERE id = %s", (username, session[0]))
        conn.commit()
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps({'ok': True})}
    finally:
        cur.close()
        conn.close()
