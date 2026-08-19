import codecs
path = r'c:\Users\MCAN\Desktop\Masa Üstü Ana Klasör\Proje Dosyaları\Proje kod dosyaları\Rent A Car - Tur Takip\tur_takip_otomasyonu\server\controllers\authController.js'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

start_str = "                notifySecurityEvent(admin, 'SUPERADMIN', req, 'NEW_LOGIN', "
end_str = "            } else {"

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx)

if start_idx != -1 and end_idx != -1:
    end_idx_full = content.find('\n', start_idx) + 1 # just after notifySecurityEvent line
    
    new_code = """
                const isTourTracking = admin.Role.includes('TOUR_TRACKING');
                return res.json({ 
                    role: admin.Role,
                    targetModule: isTourTracking ? 'TOUR_TRACKING' : 'MASTER',
                    token,
                    message: isTourTracking ? 'Tur Takip personeli girişi başarılı.' : 'SüperAdmin/Merkez Personeli girişi başarılı.'
                });
"""
    new_content = content[:end_idx_full] + new_code + content[end_idx:]
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILED TO FIND INDICES")
