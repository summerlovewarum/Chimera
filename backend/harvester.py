import threading
import time
import random
import sqlite3
from datetime import datetime
from backend.database import get_db_connection, add_log

class Harvester:
    def __init__(self):
        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._worker_loop, daemon=True)
        self._thread.start()

    def _worker_loop(self):
        print("Harvester background worker started.")
        while not self._stop_event.is_set():
            try:
                self._process_tasks()
            except Exception as e:
                print(f"Harvester Error: {e}")
            time.sleep(3) # 每3秒轮询一次

    def _process_tasks(self):
        conn = get_db_connection()
        # 查找所有状态为 'processing' 的任务
        targets = conn.execute("SELECT * FROM targets WHERE status = 'processing'").fetchall()
        
        for target in targets:
            self._simulate_harvest(target)
        
        conn.close()

    def _simulate_harvest(self, target):
        tid = target['id']
        
        # 随机决定当前动作：写日志、发现数据、还是无操作
        action = random.choice(['log', 'log', 'data', 'nothing', 'nothing'])
        
        if action == 'log':
            msgs = [
                "Scanning ports...",
                "Bypassing CAPTCHA...",
                "Following redirect...",
                "Parsing HTML structure...",
                "Tor circuit rotated...",
                "Analyzing page content..."
            ]
            add_log(tid, "INFO", random.choice(msgs))
        
        elif action == 'data':
            # 模拟发现数据
            keywords = target['keywords'].split(',') if target['keywords'] else ["general"]
            keyword = random.choice(keywords).strip()
            
            fake_content = f"Found sensitive data related to {keyword}. Context snippet: {random.randint(100000,999999)}..."
            fake_url = target['url'] if target['url'] else f"http://dark{random.randint(100,999)}.onion/post/{random.randint(1,500)}"
            
            conn = get_db_connection()
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            conn.execute('''
                INSERT INTO harvested_data 
                (target_id, url, content_snippet, matched_keywords, timestamp, tags)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (tid, fake_url, fake_content, keyword, timestamp, "sensitive,leaked"))
            
            conn.commit()
            conn.close()
            
            add_log(tid, "SUCCESS", f"Data captured: {keyword}")

        # 极小概率任务完成
        if random.random() < 0.02:
            conn = get_db_connection()
            conn.execute("UPDATE targets SET status = 'completed', last_run = ? WHERE id = ?", 
                         (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), tid))
            conn.commit()
            conn.close()
            add_log(tid, "SUCCESS", "Task completed successfully.")

    def stop(self):
        self._stop_event.set()

harvester = Harvester()
