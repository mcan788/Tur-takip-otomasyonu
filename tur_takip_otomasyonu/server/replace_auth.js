const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers', 'authController.js');
let content = fs.readFileSync(filePath, 'utf8');

const startStr = "                const token = jwt.sign(";
const endStr = "            } else {\n                return res.status(401).json({ error: 'Geçersiz süper admin şifresi veya kullanıcı adı.' });";

const startIdx = content.indexOf(startStr, content.indexOf("const token = jwt.sign("));
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newCode = `                const token = jwt.sign(
                    { username: admin.Username, role: admin.Role, dbName: 'TurMasterDB' },
                    process.env.JWT_SECRET,
                    { expiresIn: '8h' }
                );
                notifySecurityEvent(admin, 'SUPERADMIN', req, 'NEW_LOGIN', 'Yeni Giriş İşlemi');
                
                const isTourTracking = admin.Role.includes('TOUR_TRACKING');
                
                return res.json({ 
                    role: admin.Role,
                    targetModule: isTourTracking ? 'TOUR_TRACKING' : 'MASTER',
                    token,
                    message: isTourTracking ? 'Tur Takip personeli girişi başarılı.' : 'SüperAdmin/Merkez Personeli girişi başarılı.'
                });
`;
    const newContent = content.substring(0, startIdx) + newCode + content.substring(endIdx);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('FAILED TO FIND INDICES', startIdx, endIdx);
}
