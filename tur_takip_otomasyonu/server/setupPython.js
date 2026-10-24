const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../..');
const rentACarDir = path.join(rootDir, 'rent_a_car');
const pydepsDir = path.join(rentACarDir, '.pydeps');
const reqFile = path.join(rentACarDir, 'requirements.txt');

function getPydepsEnv() {
    const sep = process.platform === 'win32' ? ';' : ':';
    const existing = process.env.PYTHONPATH || '';
    const newPath = existing ? `${pydepsDir}${sep}${existing}` : pydepsDir;
    return {
        ...process.env,
        PYTHONPATH: newPath,
        PIP_BREAK_SYSTEM_PACKAGES: '1',
        PIP_DISABLE_PIP_VERSION_CHECK: '1',
        PYTHONIOENCODING: 'utf-8'
    };
}

function cleanBrokenVenv() {
    if (process.platform === 'win32') return;
    const venvDir = path.join(rootDir, '.venv');
    const venvPip = path.join(venvDir, 'bin/pip');
    if (fs.existsSync(venvDir) && !fs.existsSync(venvPip)) {
        try {
            console.log('[Python Setup] Bozuk .venv klasörü temizleniyor...');
            fs.rmSync(venvDir, { recursive: true, force: true });
        } catch (err) {
            console.warn('[Python Setup] .venv silinemedi:', err.message);
        }
    }
}

function resolvePythonCommand() {
    cleanBrokenVenv();
    const candidates = process.platform === 'win32'
        ? [
            path.join(rootDir, '.venv/Scripts/python.exe'),
            path.resolve(rootDir, '../.venv/Scripts/python.exe')
        ]
        : [
            path.join(rootDir, '.venv/bin/python'),
            path.resolve(rootDir, '../.venv/bin/python')
        ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            if (process.platform !== 'win32') {
                const pipCompanion = path.join(path.dirname(candidate), 'pip');
                if (!fs.existsSync(pipCompanion)) continue;
            }
            return candidate;
        }
    }

    if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;

    if (process.platform !== 'win32') {
        try {
            execSync('python3 --version', { stdio: 'ignore' });
            return 'python3';
        } catch (_) {
            return 'python';
        }
    }
    return 'python';
}

function checkImports(pyCmd) {
    const modulesToCheck = process.platform === 'win32'
        ? 'flask, flask_sqlalchemy, flask_login, flask_wtf, waitress, jwt, cryptography, bcrypt'
        : 'flask, flask_sqlalchemy, flask_login, flask_wtf, waitress, jwt, cryptography, pyotp, bcrypt, openpyxl';
    try {
        execSync(
            `"${pyCmd}" -c "import ${modulesToCheck}"`,
            { env: getPydepsEnv(), stdio: 'pipe' }
        );
        return true;
    } catch (_) {
        return false;
    }
}

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode} while downloading ${url}`));
            }
            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
            file.on('error', reject);
        });
        request.on('error', reject);
    });
}

async function ensurePythonEnvironment() {
    const pyCmd = resolvePythonCommand();
    if (checkImports(pyCmd)) {
        console.log(`[Python Setup] Tüm Python bağımlılıkları hazır (${pyCmd}).`);
        return { pyCmd, pydepsDir, env: getPydepsEnv() };
    }

    console.log(`[Python Setup] Eksik Python paketleri '${pydepsDir}' dizinine kuruluyor...`);
    fs.mkdirSync(pydepsDir, { recursive: true });
    const env = getPydepsEnv();

    let hasModulePip = false;
    try {
        execSync(`"${pyCmd}" -m pip --version`, { env, stdio: 'ignore' });
        hasModulePip = true;
    } catch (_) {
        hasModulePip = false;
    }

    if (!hasModulePip) {
        let hasPip3 = false;
        if (process.platform !== 'win32') {
            try {
                execSync('pip3 --version', { env, stdio: 'ignore' });
                hasPip3 = true;
            } catch (_) {
                hasPip3 = false;
            }
        }

        if (hasPip3) {
            console.log('[Python Setup] pip3 ile paketler kuruluyor...');
            execSync(
                `pip3 install --no-cache-dir --target "${pydepsDir}" --no-warn-script-location -r "${reqFile}"`,
                { env, stdio: 'inherit' }
            );
            return { pyCmd, pydepsDir, env };
        }

        console.log('[Python Setup] pip bulunamadı, get-pip.py indiriliyor...');
        const getPipPath = path.join(os.tmpdir(), 'get-pip.py');
        await downloadFile('https://bootstrap.pypa.io/get-pip.py', getPipPath);
        execSync(
            `"${pyCmd}" "${getPipPath}" --target "${pydepsDir}" --no-warn-script-location`,
            { env, stdio: 'inherit' }
        );
    }

    console.log(`[Python Setup] ${pyCmd} -m pip ile requirements.txt kuruluyor...`);
    execSync(
        `"${pyCmd}" -m pip install --no-cache-dir --target "${pydepsDir}" --no-warn-script-location -r "${reqFile}"`,
        { env, stdio: 'inherit' }
    );

    if (checkImports(pyCmd)) {
        console.log('[Python Setup] Python bağımlılıkları başarıyla kuruldu ve doğrulandı.');
    } else {
        console.warn('[Python Setup] Kurulum tamamlandı ancak bazı modüller doğrulanamadı.');
    }

    return { pyCmd, pydepsDir, env };
}

if (require.main === module) {
    ensurePythonEnvironment()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('[Python Setup Error]:', err.message);
            process.exit(0); // postinstall aşamasını kırmamak için 0 ile çık
        });
}

module.exports = { ensurePythonEnvironment, resolvePythonCommand, getPydepsEnv, pydepsDir };
