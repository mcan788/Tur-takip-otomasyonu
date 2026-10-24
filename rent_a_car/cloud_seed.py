import uuid
from datetime import datetime, timedelta
from extensions import db, get_tenant_session, ensure_tenant_tables
from models import Company, User, Vehicle, Rental, Service, VehicleExpense


def seed_tenant_fleet(subdomain, app):
    """Seed the 20-vehicle Turkish fleet, rentals, services, and expenses into a tenant DB if empty."""
    ensure_tenant_tables(subdomain, app)
    ts = get_tenant_session(subdomain, app)
    try:
        if ts.query(Vehicle).count() > 0 and ts.query(Rental).count() > 0:
            return
        if ts.query(Vehicle).count() > 0 and ts.query(Rental).count() == 0:
            ts.query(VehicleExpense).delete()
            ts.query(Service).delete()
            ts.query(Vehicle).delete()
            ts.commit()

        print(f"[CLOUD SEED] Seeding 20-vehicle fleet & demo rentals for tenant '{subdomain}'...", flush=True)
        vehicles_data = [
            {"plaka": "34 ABC 001", "marka": "Mercedes-Benz", "model": "C200", "yil": 2023, "renk": "Metalik Gri", "guncelKm": 18200, "alisKm": 0, "sigortaBitisTarihi": "2026-12-01", "vizeBitisTarihi": "2026-06-15", "bakimYapildigiKm": 15000},
            {"plaka": "06 XYZ 99", "marka": "BMW", "model": "320i", "yil": 2022, "renk": "Siyah", "guncelKm": 42000, "alisKm": 5000, "sigortaBitisTarihi": "2027-01-20", "vizeBitisTarihi": "2026-08-10", "bakimYapildigiKm": 40000},
            {"plaka": "35 TR 3535", "marka": "Audi", "model": "A4", "yil": 2024, "renk": "Beyaz", "guncelKm": 5200, "alisKm": 0, "sigortaBitisTarihi": "2027-04-10", "vizeBitisTarihi": "2027-04-10", "bakimYapildigiKm": 0},
            {"plaka": "07 ANT 07", "marka": "Volkswagen", "model": "Passat", "yil": 2021, "renk": "Okyanus Mavi", "guncelKm": 89500, "alisKm": 20000, "sigortaBitisTarihi": "2026-10-05", "vizeBitisTarihi": "2026-03-20", "bakimYapildigiKm": 80000},
            {"plaka": "34 RENT 01", "marka": "Renault", "model": "Megane", "yil": 2022, "renk": "Platin Gümüş", "guncelKm": 35000, "alisKm": 0, "sigortaBitisTarihi": "2026-05-15", "vizeBitisTarihi": "2026-05-15", "bakimYapildigiKm": 30000},
            {"plaka": "34 EGE 34", "marka": "Fiat", "model": "Egea Sedan", "yil": 2023, "renk": "Opak Beyaz", "guncelKm": 48300, "alisKm": 0, "sigortaBitisTarihi": "2026-11-20", "vizeBitisTarihi": "2026-11-20", "bakimYapildigiKm": 40000},
            {"plaka": "35 DAC 90", "marka": "Dacia", "model": "Duster", "yil": 2022, "renk": "Kum Beji", "guncelKm": 62400, "alisKm": 12000, "sigortaBitisTarihi": "2026-09-08", "vizeBitisTarihi": "2026-09-08", "bakimYapildigiKm": 60000},
            {"plaka": "06 PGT 300", "marka": "Peugeot", "model": "3008", "yil": 2023, "renk": "İnci Kırmızı", "guncelKm": 22100, "alisKm": 0, "sigortaBitisTarihi": "2026-07-22", "vizeBitisTarihi": "2026-07-22", "bakimYapildigiKm": 20000},
            {"plaka": "34 TOY 88", "marka": "Toyota", "model": "Corolla Hybrid", "yil": 2022, "renk": "Kar Beyazı", "guncelKm": 51200, "alisKm": 0, "sigortaBitisTarihi": "2027-02-14", "vizeBitisTarihi": "2027-02-14", "bakimYapildigiKm": 50000},
            {"plaka": "34 CIV 16", "marka": "Honda", "model": "Civic", "yil": 2023, "renk": "Kozmos Gri", "guncelKm": 18400, "alisKm": 0, "sigortaBitisTarihi": "2026-08-30", "vizeBitisTarihi": "2026-08-30", "bakimYapildigiKm": 10000},
            {"plaka": "34 HYU 55", "marka": "Hyundai", "model": "i20", "yil": 2023, "renk": "Buz Mavisi", "guncelKm": 28600, "alisKm": 0, "sigortaBitisTarihi": "2026-10-12", "vizeBitisTarihi": "2026-10-12", "bakimYapildigiKm": 20000},
            {"plaka": "34 TAY 911", "marka": "Porsche", "model": "Taycan 4S", "yil": 2024, "renk": "Metalik Mavi", "guncelKm": 3100, "alisKm": 0, "sigortaBitisTarihi": "2027-05-01", "vizeBitisTarihi": "2027-05-01", "bakimYapildigiKm": 0},
            {"plaka": "34 SKO 13", "marka": "Skoda", "model": "Octavia", "yil": 2023, "renk": "Grafit Gri", "guncelKm": 14200, "alisKm": 0, "sigortaBitisTarihi": "2026-10-25", "vizeBitisTarihi": "2026-10-25", "bakimYapildigiKm": 10000},
            {"plaka": "34 KIA 44", "marka": "Kia", "model": "Sportage", "yil": 2023, "renk": "Çelik Gümüş", "guncelKm": 19500, "alisKm": 0, "sigortaBitisTarihi": "2026-09-12", "vizeBitisTarihi": "2026-09-12", "bakimYapildigiKm": 15000},
            {"plaka": "34 CLI 85", "marka": "Renault", "model": "Clio", "yil": 2023, "renk": "Alev Kırmızı", "guncelKm": 31000, "alisKm": 0, "sigortaBitisTarihi": "2026-08-14", "vizeBitisTarihi": "2026-08-14", "bakimYapildigiKm": 30000},
            {"plaka": "34 CRS 12", "marka": "Opel", "model": "Corsa", "yil": 2022, "renk": "Volkan Siyah", "guncelKm": 38500, "alisKm": 10000, "sigortaBitisTarihi": "2026-07-30", "vizeBitisTarihi": "2026-07-30", "bakimYapildigiKm": 30000},
            {"plaka": "34 FOC 55", "marka": "Ford", "model": "Focus", "yil": 2022, "renk": "Derin Mavi", "guncelKm": 46000, "alisKm": 0, "sigortaBitisTarihi": "2026-11-05", "vizeBitisTarihi": "2026-11-05", "bakimYapildigiKm": 40000},
            {"plaka": "34 QAS 77", "marka": "Nissan", "model": "Qashqai", "yil": 2022, "renk": "Manyetik Gri", "guncelKm": 53000, "alisKm": 15000, "sigortaBitisTarihi": "2026-12-20", "vizeBitisTarihi": "2026-12-20", "bakimYapildigiKm": 50000},
            {"plaka": "34 AUD 03", "marka": "Audi", "model": "Q3 SUV", "yil": 2023, "renk": "Mitos Siyah", "guncelKm": 12800, "alisKm": 0, "sigortaBitisTarihi": "2026-10-18", "vizeBitisTarihi": "2026-10-18", "bakimYapildigiKm": 10000},
            {"plaka": "34 CUP 90", "marka": "Cupra", "model": "Formentor", "yil": 2023, "renk": "Mat Gri", "guncelKm": 15000, "alisKm": 0, "sigortaBitisTarihi": "2027-01-15", "vizeBitisTarihi": "2027-01-15", "bakimYapildigiKm": 10000}
        ]

        vehicles = []
        for v_info in vehicles_data:
            v = Vehicle(
                id=str(uuid.uuid4()),
                plaka=v_info["plaka"],
                marka=v_info["marka"],
                model=v_info["model"],
                yil=v_info["yil"],
                renk=v_info["renk"],
                guncelKm=v_info["guncelKm"],
                alisKm=v_info["alisKm"],
                sigortaBitisTarihi=v_info["sigortaBitisTarihi"],
                vizeBitisTarihi=v_info["vizeBitisTarihi"],
                bakimYapildigiKm=v_info["bakimYapildigiKm"]
            )
            ts.add(v)
            vehicles.append(v)

        ts.commit()

        today = datetime.now()
        rentals_data = [
            {"vehicle": vehicles[0], "musteri": "Ahmet Yılmaz", "baslangic": (today - timedelta(days=10)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=5)).strftime('%Y-%m-%d'), "vKm": 12000, "aKm": 13500, "fiyat": 7500, "paraBirimi": "₺", "kurum": "Yılmaz Holding"},
            {"vehicle": vehicles[0], "musteri": "John Smith", "baslangic": (today - timedelta(days=25)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=18)).strftime('%Y-%m-%d'), "vKm": 10500, "aKm": 12000, "fiyat": 650, "paraBirimi": "€", "kurum": "Smith & Partners"},
            {"vehicle": vehicles[1], "musteri": "Mehmet Demir", "baslangic": (today - timedelta(days=3)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=2)).strftime('%Y-%m-%d'), "vKm": 41500, "aKm": 0, "fiyat": 10000, "paraBirimi": "₺", "kurum": "Demir İnşaat"},
            {"vehicle": vehicles[1], "musteri": "David Miller", "baslangic": (today - timedelta(days=12)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=6)).strftime('%Y-%m-%d'), "vKm": 40000, "aKm": 41500, "fiyat": 480, "paraBirimi": "$", "kurum": "Miller Logistics"},
            {"vehicle": vehicles[2], "musteri": "Hans Schmidt", "baslangic": (today - timedelta(days=5)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=3)).strftime('%Y-%m-%d'), "vKm": 4200, "aKm": 0, "fiyat": 720, "paraBirimi": "€", "kurum": "Schmidt Group"},
            {"vehicle": vehicles[3], "musteri": "Ayşe Kaya", "baslangic": (today - timedelta(days=20)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=15)).strftime('%Y-%m-%d'), "vKm": 82000, "aKm": 84000, "fiyat": 6000, "paraBirimi": "₺", "kurum": "Kaya Mimarlık"},
            {"vehicle": vehicles[4], "musteri": "Caner Öz", "baslangic": (today - timedelta(days=2)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=5)).strftime('%Y-%m-%d'), "vKm": 34500, "aKm": 0, "fiyat": 8400, "paraBirimi": "₺", "kurum": "Öz Gıda"},
            {"vehicle": vehicles[5], "musteri": "Selin Şahin", "baslangic": (today - timedelta(days=15)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=5)).strftime('%Y-%m-%d'), "vKm": 42000, "aKm": 44500, "fiyat": 12000, "paraBirimi": "₺", "kurum": "Şahin Teknoloji"},
            {"vehicle": vehicles[6], "musteri": "Kaan Karaca", "baslangic": (today - timedelta(days=1)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=6)).strftime('%Y-%m-%d'), "vKm": 61200, "aKm": 0, "fiyat": 10500, "paraBirimi": "₺", "kurum": "Karaca Otomotiv"},
            {"vehicle": vehicles[8], "musteri": "Zeynep Yurt", "baslangic": (today - timedelta(days=30)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=27)).strftime('%Y-%m-%d'), "vKm": 49000, "aKm": 49800, "fiyat": 3600, "paraBirimi": "₺", "kurum": ""},
            {"vehicle": vehicles[9], "musteri": "Ali Aslan", "baslangic": (today - timedelta(days=8)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=1)).strftime('%Y-%m-%d'), "vKm": 16200, "aKm": 17800, "fiyat": 9100, "paraBirimi": "₺", "kurum": "Aslan Lojistik"},
            {"vehicle": vehicles[10], "musteri": "Buse Çelik", "baslangic": (today - timedelta(days=4)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=1)).strftime('%Y-%m-%d'), "vKm": 27200, "aKm": 0, "fiyat": 6500, "paraBirimi": "₺", "kurum": ""},
            {"vehicle": vehicles[11], "musteri": "Hakan Sabancı", "baslangic": (today + timedelta(days=2)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=5)).strftime('%Y-%m-%d'), "vKm": 3100, "aKm": 0, "fiyat": 2500, "paraBirimi": "€", "kurum": "Sabancı Holding"},
            {"vehicle": vehicles[11], "musteri": "George Clooney", "baslangic": (today - timedelta(days=12)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=8)).strftime('%Y-%m-%d'), "vKm": 2100, "aKm": 3100, "fiyat": 3000, "paraBirimi": "$", "kurum": "Hollywood Productions"},
            {"vehicle": vehicles[12], "musteri": "Murat Yıldırım", "baslangic": (today - timedelta(days=7)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=1)).strftime('%Y-%m-%d'), "vKm": 13000, "aKm": 14100, "fiyat": 9600, "paraBirimi": "₺", "kurum": ""},
            {"vehicle": vehicles[14], "musteri": "Gamze Özçelik", "baslangic": (today - timedelta(days=5)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=3)).strftime('%Y-%m-%d'), "vKm": 30100, "aKm": 0, "fiyat": 6400, "paraBirimi": "₺", "kurum": "Gamze Vakfı"},
            {"vehicle": vehicles[16], "musteri": "Serkan Bolat", "baslangic": (today - timedelta(days=4)).strftime('%Y-%m-%d'), "bitis": (today - timedelta(days=1)).strftime('%Y-%m-%d'), "vKm": 45200, "aKm": 45950, "fiyat": 4800, "paraBirimi": "₺", "kurum": "Art Life Mimarlık"},
            {"vehicle": vehicles[17], "musteri": "Eda Yıldız", "baslangic": (today - timedelta(days=3)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=4)).strftime('%Y-%m-%d'), "vKm": 52100, "aKm": 0, "fiyat": 11200, "paraBirimi": "₺", "kurum": ""},
            {"vehicle": vehicles[19], "musteri": "Tarkan Tevetoğlu", "baslangic": (today + timedelta(days=4)).strftime('%Y-%m-%d'), "bitis": (today + timedelta(days=10)).strftime('%Y-%m-%d'), "vKm": 15000, "aKm": 0, "fiyat": 1500, "paraBirimi": "€", "kurum": "Hitt Müzik"}
        ]

        for r_info in rentals_data:
            v = r_info["vehicle"]
            d1 = datetime.strptime(r_info["baslangic"], '%Y-%m-%d')
            d2 = datetime.strptime(r_info["bitis"], '%Y-%m-%d')
            days = max(1, (d2 - d1).days)
            r = Rental(
                id=str(uuid.uuid4()),
                arac_id=v.id,
                plaka=v.plaka,
                marka=v.marka,
                model=v.model,
                musteriAdi=r_info["musteri"],
                isim=r_info["musteri"].split()[0],
                soyisim=r_info["musteri"].split()[1] if len(r_info["musteri"].split()) > 1 else "",
                kurumAdi=r_info.get("kurum", ""),
                baslangicTarihi=r_info["baslangic"],
                bitisTarihi=r_info["bitis"],
                kiralamaSuresi=days,
                verilisteKm=r_info["vKm"],
                alinistaKm=r_info["aKm"],
                kullanilanKm=max(0, r_info["aKm"] - r_info["vKm"]),
                gunlukFiyat=float(r_info["fiyat"] / days),
                toplamFiyat=r_info["fiyat"],
                kar=r_info["fiyat"],
                paraBirimi=r_info.get("paraBirimi", "₺")
            )
            ts.add(r)

        service_data = [
            {"vehicle": vehicles[0], "km": 15000, "ucret": 4500, "yer": "Mercedes Yetkili Servisi", "notlar": "15.000 KM periyodik bakımı tamamlandı.", "paraBirimi": "₺"},
            {"vehicle": vehicles[1], "km": 40000, "ucret": 6200, "yer": "Bosch Car Service", "notlar": "Ön-arka fren balataları yenilendi, diskler taşlandı.", "paraBirimi": "₺"},
            {"vehicle": vehicles[3], "km": 80000, "ucret": 15500, "yer": "Volkswagen Özel Servisi", "notlar": "Ağır bakım yapıldı. Triger seti, devirdaim ve filtreler değişti.", "paraBirimi": "₺"},
            {"vehicle": vehicles[5], "km": 40000, "ucret": 3800, "yer": "Fiat Yetkili Servisi", "notlar": "40.000 KM periyodik yağ bakımı yapıldı.", "paraBirimi": "₺"},
            {"vehicle": vehicles[8], "km": 50000, "ucret": 4200, "yer": "Toyota Yetkili Servisi", "notlar": "50.000 KM hibrit sistem kontrolü ve periyodik bakım.", "paraBirimi": "₺"}
        ]
        for s_info in service_data:
            v = s_info["vehicle"]
            s = Service(
                id=str(uuid.uuid4()),
                arac_id=v.id,
                plaka=v.plaka,
                km=s_info["km"],
                ucret=s_info["ucret"],
                yer=s_info["yer"],
                tarih=(today - timedelta(days=60)).strftime('%Y-%m-%d'),
                notlar=s_info["notlar"],
                paraBirimi=s_info.get("paraBirimi", "₺")
            )
            ts.add(s)

        expense_data = [
            {"vehicle": vehicles[0], "tip": "Sigorta", "tutar": 12000, "notlar": "Allianz Genişletilmiş Kasko Yenileme", "paraBirimi": "₺"},
            {"vehicle": vehicles[1], "tip": "Vize", "tutar": 1850, "notlar": "TÜVTÜRK periyodik araç muayenesi geçildi", "paraBirimi": "₺"},
            {"vehicle": vehicles[2], "tip": "Sigorta", "tutar": 5500, "notlar": "Zorunlu Trafik Sigortası Poliçesi", "paraBirimi": "₺"},
            {"vehicle": vehicles[3], "tip": "Sigorta", "tutar": 9800, "notlar": "Axa Kasko Sigortası Yenileme", "paraBirimi": "₺"}
        ]
        for e_info in expense_data:
            v = e_info["vehicle"]
            e = VehicleExpense(
                id=str(uuid.uuid4()),
                arac_id=v.id,
                plaka=v.plaka,
                gider_tipi=e_info["tip"],
                tutar=e_info["tutar"],
                tarih=(today - timedelta(days=30)).strftime('%Y-%m-%d'),
                notlar=e_info["notlar"],
                paraBirimi=e_info.get("paraBirimi", "₺")
            )
            ts.add(e)

        ts.commit()
        print(f"[CLOUD SEED] Tenant '{subdomain}' seeded successfully.", flush=True)
    except Exception as err:
        ts.rollback()
        print(f"[CLOUD SEED ERROR] Failed seeding tenant '{subdomain}': {err}", flush=True)


def init_and_seed_rent_a_car(app):
    """Ensure master tables, default companies/users, and demo tenant data exist."""
    with app.app_context():
        try:
            db.create_all()

            # 1. Master Company (ID = 1, subdomain = 'www')
            master_comp = db.session.get(Company, 1)
            if not master_comp:
                master_comp = Company(
                    id=1,
                    name="Zyronova Merkez",
                    subdomain="www",
                    contact_email="admin@zyronova.com",
                    license_key="MASTER-ZYRONOVA-001",
                    license_price=0.0,
                    is_active=True
                )
                db.session.add(master_comp)
                db.session.commit()

            # 2. Demo Rent A Car Company ('RentACarDemo')
            demo_comp = Company.query.filter(
                db.func.lower(Company.subdomain) == 'rentacardemo'
            ).first()
            if not demo_comp:
                demo_comp = Company(
                    name="Zyronova Rent A Car",
                    subdomain="RentACarDemo",
                    contact_email="demo@rentacar.com",
                    contact_phone="+90 242 555 01 99",
                    license_key="RNT-DEMO-2026",
                    license_price=15000.0,
                    license_expires_at=datetime.now() + timedelta(days=365),
                    is_active=True
                )
                db.session.add(demo_comp)
                db.session.commit()

            # 3. SuperAdmin user ('admin' / 'admin123')
            admin_user = User.query.filter(db.func.lower(User.username) == 'admin').first()
            if not admin_user:
                admin_user = User(
                    username="admin",
                    name="Sistem Yöneticisi",
                    company_id=1,
                    company_name="Zyronova Merkez",
                    role="admin",
                    role_id=11,
                    email="admin@zyronova.com",
                    needs_password_change=False
                )
                admin_user.set_password("admin123")
                db.session.add(admin_user)
                db.session.commit()

            # 4. Demo Rent A Car user ('RentACarDemo' / 'demo123')
            demo_user = User.query.filter(db.func.lower(User.username) == 'rentacardemo').first()
            if not demo_user:
                demo_user = User(
                    username="RentACarDemo",
                    name="Rent A Car Demo Yönetici",
                    company_id=demo_comp.id,
                    company_name=demo_comp.name,
                    role="yonetici",
                    role_id=21,
                    email="demo@rentacar.com",
                    needs_password_change=False
                )
                demo_user.set_password("demo123")
                db.session.add(demo_user)
                db.session.commit()
            elif demo_user.needs_password_change:
                demo_user.needs_password_change = False
                db.session.commit()

            # 5. Seed fleet into both 'RentACarDemo' and 'www'
            seed_tenant_fleet("RentACarDemo", app)
            seed_tenant_fleet("www", app)

        except Exception as e:
            print(f"[CLOUD SEED] Master DB initialization warning: {e}", flush=True)
