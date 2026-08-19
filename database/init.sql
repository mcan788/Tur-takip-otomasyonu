/* 
   Tur Takip Sistemi - MSSQL Veritabanı Şeması
   Bu dosya TurTakipDB veritabanı için gerekli temel tabloları içerir.
*/

CREATE DATABASE TurTakipDB;
GO

USE TurTakipDB;
GO

-- Acenteler Tablosu
CREATE TABLE Agencies (
    AgencyID INT PRIMARY KEY IDENTITY(1,1),
    AgencyName NVARCHAR(255) NOT NULL,
    Username NVARCHAR(100) UNIQUE NOT NULL,
    OwnerName NVARCHAR(255) NOT NULL,
    OwnerEmail NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    ModuleType NVARCHAR(50) NOT NULL,
    LicenseKey NVARCHAR(100) UNIQUE NOT NULL,
    LicenseExpiryDate DATETIME NOT NULL,
    LicensePrice DECIMAL(18, 2) DEFAULT 0, -- SüperAdmin'in kazancı
    MustChangePassword BIT DEFAULT 1, -- İlk girişte şifre değişimi zorunlu mu?
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Ofisler Tablosu
CREATE TABLE Offices (
    OfficeID INT PRIMARY KEY IDENTITY(1,1),
    AgencyID INT FOREIGN KEY REFERENCES Agencies(AgencyID),
    OfficeName NVARCHAR(255) NOT NULL,
    Location NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Turlar Tablosu
CREATE TABLE Tours (
    TourID INT PRIMARY KEY IDENTITY(1,1),
    AgencyID INT FOREIGN KEY REFERENCES Agencies(AgencyID),
    TourName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    DefaultPassFee DECIMAL(18, 2), 
    DefaultCurrency NVARCHAR(10) DEFAULT '€', -- '€' veya '$'
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Rezervasyonlar / Kayıtlar
CREATE TABLE Bookings (
    BookingID INT PRIMARY KEY IDENTITY(1,1),
    TourID INT FOREIGN KEY REFERENCES Tours(TourID),
    OfficeID INT FOREIGN KEY REFERENCES Offices(OfficeID),
    TouristName NVARCHAR(255),
    HotelName NVARCHAR(255),
    ActualPassFee DECIMAL(18, 2), 
    Earnings DECIMAL(18, 2),
    Currency NVARCHAR(10) DEFAULT '€', -- '€' veya '$'
    IsApproved BIT NOT NULL DEFAULT 0,
    BookingDate DATETIME DEFAULT GETDATE()
);
