import pyodbc

conn = pyodbc.connect(r'DRIVER={ODBC Driver 17 for SQL Server};SERVER=.\SQLEXPRESS;DATABASE=TurMasterDB;Trusted_Connection=yes;')
cr = conn.cursor()
cr.execute('SELECT AgencyID, AgencyName, Username, AgencyDBName FROM Agencies ORDER BY AgencyID DESC')
for row in cr.fetchall():
    print(row)
