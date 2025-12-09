import time
import threading
import random
from datetime import datetime

class TorService:
    def __init__(self):
        self.status = "STOPPED" # 状态: STOPPED, STARTING, RUNNING, STOPPING
        self.platform = "Linux (x86_64)"
        self.ip = None
        self.logs = []
        self._stop_event = threading.Event()
        self._thread = None

    def _log(self, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {msg}"
        self.logs.append(log_entry)
        # 保持日志长度不过长
        if len(self.logs) > 50:
            self.logs.pop(0)

    def start(self):
        if self.status in ["RUNNING", "STARTING"]:
            return {"message": "Tor is already running."}
        
        self.status = "STARTING"
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._bootstrap_process)
        self._thread.start()
        return {"message": "Tor initialization started."}

    def stop(self):
        if self.status == "STOPPED":
            return {"message": "Tor is already stopped."}
        
        self.status = "STOPPING"
        self._stop_event.set()
        if self._thread:
            self._thread.join()
        self.status = "STOPPED"
        self.ip = None
        self._log("Tor service stopped.")
        return {"message": "Tor stopped successfully."}

    def _bootstrap_process(self):
        self._log("Bootstrapped 0%: Starting")
        time.sleep(1)
        if self._stop_event.is_set(): return

        self._log("Bootstrapped 10%: Finishing handshake with directory server")
        time.sleep(1.5)
        if self._stop_event.is_set(): return

        self._log("Bootstrapped 50%: Loading relay descriptors")
        time.sleep(2)
        if self._stop_event.is_set(): return
        
        self.status = "SYNCHRONIZING" # 用于前端显示黄色状态
        self._log("Bootstrapped 80%: Connecting to the Tor network")
        time.sleep(2)
        if self._stop_event.is_set(): return

        self._log("Bootstrapped 100%: Done")
        self.status = "RUNNING"
        self.ip = f"10.2.{random.randint(10, 99)}.{random.randint(10, 255)}" # 模拟的内部线路 IP
        self._log(f"Circuit established. Virtual IP: {self.ip}")
        
        # 保持运行循环，偶尔输出心跳日志
        while not self._stop_event.is_set():
            time.sleep(5)
            if random.random() < 0.1:
                self._log("Heartbeat: Circuit is healthy")

    def get_status(self):
        return {
            "status": self.status,
            "platform": self.platform,
            "ip": self.ip,
            "logs": self.logs[-10:] # API 只返回最近10条
        }

# 单例模式
tor_service = TorService()
