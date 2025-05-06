import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='Marius16082003@',
        port=3306
    )
    print("✓ Conexiune directă cu succes!")
    cursor = connection.cursor()
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    print("Databases:")
    for db in databases:
        print(f"  - {db[0]}")
    cursor.close()
    connection.close()
except Exception as e:
    print(f"❌ Eroare: {str(e)}")