import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SQLITE_DIR = os.getenv('RENT_SQLITE_DIR', os.path.join(BASE_DIR, 'data', 'sqlite'))
os.makedirs(SQLITE_DIR, exist_ok=True)

# Ensure default JWT_SECRET and ENCRYPTION_KEY exist in environment for SSO & KVKK
if not os.getenv('JWT_SECRET'):
    os.environ['JWT_SECRET'] = 'zyronova_jwt_secret_key_7a9d8c6b2e1f4a'
if not os.getenv('ENCRYPTION_KEY'):
    os.environ['ENCRYPTION_KEY'] = '9u3g8htIZALnQwM61s_LvKkYkYN-1YdlCaMgksKxiUQ='


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'zyronova-enterprise-secret-key-2026-secure-v9x8m2k4p7q1w5e3r6t0y')
    if SECRET_KEY == 'rentacar-ciro-secret-key-2026':
        SECRET_KEY = 'zyronova-enterprise-secret-key-2026-secure-v9x8m2k4p7q1w5e3r6t0y'

    JWT_SECRET = os.getenv('JWT_SECRET', 'zyronova_jwt_secret_key_7a9d8c6b2e1f4a')
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', '9u3g8htIZALnQwM61s_LvKkYkYN-1YdlCaMgksKxiUQ=')

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    SESSION_REFRESH_EACH_REQUEST = True

    # Cloud / Render SQLite mode by default unless USE_MSSQL=true
    USE_MSSQL = os.getenv('USE_MSSQL', 'false').lower() == 'true'
    USE_SQLITE = not USE_MSSQL
    SQLITE_DIR = SQLITE_DIR

    # Multi-tenant DB settings
    DB_SERVER = os.getenv('DB_SERVER', 'localhost')
    DB_DRIVER = os.getenv('DB_DRIVER', 'ODBC Driver 17 for SQL Server')
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')

    if USE_SQLITE:
        master_db_path = os.path.join(SQLITE_DIR, 'zyronova_master.db')
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{master_db_path}"
    else:
        import urllib.parse
        _tcp_server = DB_SERVER.replace('.\\', 'localhost\\') if DB_SERVER.startswith('.\\') else DB_SERVER
        if DB_USER and DB_PASSWORD:
            _conn_str = f"DRIVER={{{DB_DRIVER}}};SERVER={_tcp_server};DATABASE=ZYRONOVA_MASTER;UID={DB_USER};PWD={DB_PASSWORD};Encrypt=no;TrustServerCertificate=yes"
        else:
            _conn_str = f"DRIVER={{{DB_DRIVER}}};SERVER={_tcp_server};DATABASE=ZYRONOVA_MASTER;Trusted_Connection=yes;Encrypt=no;TrustServerCertificate=yes"
        _params = urllib.parse.quote_plus(_conn_str)
        SQLALCHEMY_DATABASE_URI = f"mssql+pyodbc:///?odbc_connect={_params}"

    # Custom configurations
    TCMB_XML_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"
