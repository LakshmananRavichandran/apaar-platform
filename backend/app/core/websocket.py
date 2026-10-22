from fastapi import WebSocket
from typing import List, Dict, Any
import json
import logging

logger = logging.getLogger("websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        data_str = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(data_str)
            except Exception:
                dead_connections.append(connection)
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

    async def send_personal(self, message: Dict[str, Any], user_id: int):
        if user_id in self.user_connections:
            data_str = json.dumps(message)
            dead_connections = []
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(data_str)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                if dead in self.user_connections[user_id]:
                    self.user_connections[user_id].remove(dead)

ws_manager = ConnectionManager()
