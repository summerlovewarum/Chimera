import sqlite3
import datetime
import os

DB_PATH = 'chimera.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 创建 targets (采集目标) 表
    c.execute('''
        CREATE TABLE IF NOT EXISTS targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            url TEXT,
            keywords TEXT,
            proxy_mode TEXT DEFAULT 'tor',
            proxy_url TEXT,
            last_run TEXT,
            status TEXT DEFAULT 'pending'
        )
    ''')

    # 创建 harvest_logs (采集日志) 表
    c.execute('''
        CREATE TABLE IF NOT EXISTS harvest_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id INTEGER,
            timestamp TEXT,
            level TEXT,
            message TEXT,
            FOREIGN KEY(target_id) REFERENCES targets(id)
        )
    ''')

    # 创建 harvested_data (采集结果) 表
    c.execute('''
        CREATE TABLE IF NOT EXISTS harvested_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id INTEGER,
            url TEXT,
            content_snippet TEXT,
            matched_keywords TEXT,
            timestamp TEXT,
            video_url TEXT,
            video_title TEXT,
            tags TEXT,
            FOREIGN KEY(target_id) REFERENCES targets(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

# 辅助函数：添加日志
def add_log(target_id, level, message):
    conn = get_db_connection()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute('INSERT INTO harvest_logs (target_id, timestamp, level, message) VALUES (?, ?, ?, ?)',
                 (target_id, timestamp, level, message))
    conn.commit()
    conn.close()

# 辅助函数：如果数据库为空，注入一些初始数据方便演示
def seed_db():
    conn = get_db_connection()
    try:
        count = conn.execute('SELECT count(*) FROM targets').fetchone()[0]
        if count == 0:
            print("Seeding database...")
            c = conn.cursor()
            c.execute("INSERT INTO targets (type, url, keywords, status) VALUES ('targeted', 'http://darkmarket.onion', 'credit cards, dumps', 'pending')")
            c.execute("INSERT INTO targets (type, keywords, status) VALUES ('global', '', 'leaked credentials, database', 'stopped')")
            conn.commit()
    except Exception as e:
        print(f"Seed error: {e}")
    finally:
        conn.close()

# 允许直接运行此文件来初始化
if __name__ == '__main__':
    init_db()
    seed_db()
