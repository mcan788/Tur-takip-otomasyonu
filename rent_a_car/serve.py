import os
import logging
from app import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('waitress')

if __name__ == '__main__':
    port = int(os.getenv('PYTHON_PORT', '8080'))
    print("========================================", flush=True)
    print("   ZYRONOVA RENT A CAR SERVISI BASLATILDI", flush=True)
    print(f"   Yayin: http://127.0.0.1:{port} (Internal Gateway Proxy)", flush=True)
    print("========================================", flush=True)

    try:
        from waitress import serve
        serve(app, host='127.0.0.1', port=port, threads=16)
    except ImportError:
        app.run(host='127.0.0.1', port=port, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\nServis durduruldu.")
