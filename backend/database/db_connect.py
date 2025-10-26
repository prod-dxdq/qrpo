# Database connection templates (commented for safety)
# SQLite (local) example
# import sqlite3
# def connect_local():
#     conn = sqlite3.connect("qrpo_local.db")
#     return conn

# Azure SQL example (pyodbc)
# import pyodbc
# def connect_azure():
#     server = "your-server-name.database.windows.net"
#     database = "your-database-name"
#     username = "your-username"
#     password = "your-password"
#     driver = "{ODBC Driver 18 for SQL Server}"
#     conn = pyodbc.connect(
#         f"DRIVER={driver};SERVER={server};PORT=1433;DATABASE={database};UID={username};PWD={password}"
#     )
#     return conn
