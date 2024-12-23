from dataclasses import dataclass
from typing import List, Optional
import threading
import time

@dataclass
class RequestStats:
    total: int = 0
    completed: int = 0
    timeouts: int = 0
    errors: int = 0
    remaining: int = 0

@dataclass
class ModbusRequest:
    name: str
    function: int
    start_address: int
    count: int = 1
    slave_id: int = 1
    data: Optional[List[int]] = None
    comment: Optional[str] = None
    order: int = 0
    delay_after: float = 100000  # microseconds (100ms default)
    cycles: Optional[int] = None
    stats: RequestStats = RequestStats()

class RequestQueue:
    def __init__(self):
        self._queue = []
        self._lock = threading.Lock()
        self._stop_polling = threading.Event()
        
    def add_request(self, request: ModbusRequest, cycles: Optional[int] = None):
        with self._lock:
            request_cycles = request.cycles if request.cycles is not None else cycles
            if request_cycles is not None and request_cycles > 0:
                request.stats.total = request_cycles
                request.stats.remaining = request_cycles
                self._queue.extend([request] * request_cycles)
            else:
                # For infinite polling, add just one instance
                request.stats.total = 0  # 0 indicates infinite
                request.stats.remaining = 0
                self._queue.append(request)

    def get_next_request(self) -> Optional[ModbusRequest]:
        with self._lock:
            if self._queue:
                return self._queue.pop(0)
            return None

    def clear(self):
        with self._lock:
            self._queue.clear()

    def stop(self):
        self._stop_polling.set()

    def should_stop(self) -> bool:
        return self._stop_polling.is_set()

    def is_empty(self) -> bool:
        with self._lock:
            return len(self._queue) == 0

    def get_remaining_count(self, request_name: str) -> int:
        with self._lock:
            return len([r for r in self._queue if r.name == request_name])
