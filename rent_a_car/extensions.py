import os
import re
import sqlite3
import threading
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

db = SQLAlchemy()
login_manager = LoginManager()
csrf = CSRFProtect()

# Thread-safe tenant engine and session factory cache
_tenant_engines = {}
_tenant_sessions = {}
_engine_lock = threading.Lock()
_session_lock = threading.Lock()


def get_tur_master_sqlite_path():
    """Return path to Node.js TurMasterDB.sqlite file for cross-service sync."""
    base_dir = os.path.abspath(os.path.dirname(__file__))
    return os.path.abspath(
        os.path.join(base_dir, '..', 'tur_takip_otomasyonu', 'server', 'data', 'TurMasterDB.sqlite')
    )


def get_tenant_db_url(subdomain, app=None, db_name=None):
    """Build a connection URL for a tenant database (supports SQLite and MSSQL)."""
    from flask import current_app
    import urllib
    _app = app or current_app

    if _app.config.get('USE_SQLITE', True):
        sqlite_dir = _app.config.get('SQLITE_DIR') or os.path.join(os.path.dirname(__file__), 'data', 'sqlite')
        os.makedirs(sqlite_dir, exist_ok=True)
        safe_sub = re.sub(r'[^a-zA-Z0-9_-]', '_', (db_name or subdomain or 'www').lower())
        db_path = os.path.join(sqlite_dir, f"tenant_{safe_sub}.db")
        return f"sqlite:///{db_path}"

    server = _app.config['DB_SERVER']
    driver = _app.config['DB_DRIVER']
    user = _app.config.get('DB_USER')
    password = _app.config.get('DB_PASSWORD')

    if not db_name:
        db_name = subdomain.lower()
        _tcp_server = server.replace('.\\', 'localhost\\') if server.startswith('.\\') else server

        try:
            import pyodbc
            if user and password:
                conn_str = f"Driver={{{driver}}};Server={_tcp_server};Database=TurMasterDB;UID={user};PWD={password};Encrypt=no;TrustServerCertificate=yes;"
            else:
                conn_str = f"Driver={{{driver}}};Server={_tcp_server};Database=TurMasterDB;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes;"

            with pyodbc.connect(conn_str, timeout=10) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT AgencyDBName FROM Agencies WITH (NOLOCK) WHERE Username = ?", (subdomain,))
                    row = cursor.fetchone()
                    if row and row[0]:
                        db_name = row[0]
        except Exception as e:
            raise e
    _tcp_server = server.replace('.\\', 'localhost\\') if server.startswith('.\\') else server

    if user and password:
        params = urllib.parse.quote_plus(f"DRIVER={{{driver}}};SERVER={_tcp_server};DATABASE={db_name};UID={user};PWD={password};Encrypt=no;TrustServerCertificate=yes")
    else:
        params = urllib.parse.quote_plus(f"DRIVER={{{driver}}};SERVER={_tcp_server};DATABASE={db_name};Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes")

    return f"mssql+pyodbc:///?odbc_connect={params}"


def check_and_update_tenant_schema(engine):
    """Deprecated: Schema is now managed by the DB Migration system."""
    pass


def get_tenant_engine(subdomain, app=None, db_name=None):
    """Get or create a cached engine for the given tenant subdomain."""
    from flask import current_app
    _app = app or current_app
    key = subdomain.upper()
    if key not in _tenant_engines:
        with _engine_lock:
            if key not in _tenant_engines:
                url = get_tenant_db_url(subdomain, _app, db_name=db_name)
                if url.startswith('sqlite'):
                    engine = create_engine(
                        url,
                        connect_args={"check_same_thread": False}
                    )
                else:
                    from sqlalchemy.pool import QueuePool
                    engine = create_engine(
                        url,
                        poolclass=QueuePool,
                        pool_size=10,
                        max_overflow=20,
                        pool_timeout=30,
                        pool_recycle=1800,
                        pool_pre_ping=True
                    )
                check_and_update_tenant_schema(engine)
                _tenant_engines[key] = engine
    return _tenant_engines[key]


def ensure_tenant_tables(subdomain, app=None):
    """Auto-scan tenant database and create any missing tables safely."""
    try:
        from models import TenantBase
        tenant_engine = get_tenant_engine(subdomain, app)
        TenantBase.metadata.create_all(tenant_engine)
    except Exception as e:
        print(f"[TENANT AUTO-MIGRATE ERROR] Failed to create missing tables for {subdomain}: {e}", flush=True)


def get_tenant_session(subdomain=None, app=None, db_name=None):
    """Get or create a cached scoped session for a tenant database."""
    from flask import g
    if subdomain is None:
        subdomain = g.current_company.subdomain
    if db_name is None and hasattr(g, 'current_company') and g.current_company:
        db_name = getattr(g.current_company, 'db_name', None)

    key = subdomain.upper()
    if key not in _tenant_sessions:
        with _session_lock:
            if key not in _tenant_sessions:
                ensure_tenant_tables(subdomain, app)
                engine = get_tenant_engine(subdomain, app, db_name=db_name)
                session_factory = sessionmaker(bind=engine)
                _tenant_sessions[key] = scoped_session(session_factory)

    return _tenant_sessions[key]()


def close_all_tenant_sessions():
    """Remove and clean up all scoped sessions for the current thread context."""
    with _session_lock:
        for session_obj in _tenant_sessions.values():
            try:
                session_obj.remove()
            except Exception:
                pass


def create_tenant_database(subdomain, app=None):
    """Create a new tenant database and all tenant tables."""
    from flask import current_app
    from models import TenantBase
    _app = app or current_app
    db_name = subdomain.lower()

    if not _app.config.get('USE_SQLITE', True):
        master_url = _app.config['SQLALCHEMY_DATABASE_URI']
        master_engine = create_engine(master_url, isolation_level="AUTOCOMMIT")

        with master_engine.connect() as conn:
            result = conn.execute(
                __import__('sqlalchemy').text(f"SELECT DB_ID('{db_name}')")
            )
            exists = result.scalar() is not None

            if not exists:
                conn.execute(__import__('sqlalchemy').text(f"CREATE DATABASE [{db_name}]"))
                print(f"[TENANT] Veritabani olusturuldu: {db_name}")

        master_engine.dispose()

    tenant_engine = get_tenant_engine(subdomain, _app)
    TenantBase.metadata.create_all(tenant_engine)
    print(f"[TENANT] Tablolar olusturuldu: {db_name}")

    return db_name


def init_extensions(app):
    if app.config.get('USE_SQLITE', True):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            "connect_args": {"check_same_thread": False}
        }
    else:
        from sqlalchemy.pool import QueuePool
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            "poolclass": QueuePool,
            "pool_size": 10,
            "max_overflow": 20,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "pool_pre_ping": True
        }
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Lütfen önce giriş yapın.'
    login_manager.login_message_category = 'info'

    try:
        from sqlalchemy import event
        from models import Rental, Vehicle, Service, VehicleExpense
        from utils.stats import invalidate_stats_cache

        def on_change(mapper, connection, target):
            invalidate_stats_cache()

        for model in [Rental, Vehicle, Service, VehicleExpense]:
            event.listen(model, 'after_insert', on_change)
            event.listen(model, 'after_update', on_change)
            event.listen(model, 'after_delete', on_change)

        from sqlalchemy.orm import configure_mappers
        configure_mappers()

        print("[STATS CACHE] SQLAlchemy mutation cache invalidation listeners registered successfully.")
    except Exception as e:
        print(f"[STATS CACHE] Failed to register listeners: {e}")
