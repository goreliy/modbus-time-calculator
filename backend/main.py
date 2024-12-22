from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union, Dict
import uvicorn
from modbus_handler import ModbusHandler, ModbusSettings, ModbusRequest
import threading

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

modbus_handler = ModbusHandler()
polling_thread = None
polling_status = {
    "is_polling": False,
    "stats": {},
    "selected_requests": []
}

class ConnectionSettings(BaseModel):
    connectionType: str = 'serial'
    port: Optional[str] = None
    baudRate: Optional[int] = None
    parity: Optional[str] = None
    stopBits: Optional[float] = None
    dataBits: Optional[int] = None
    timeout: float
    ipAddress: Optional[str] = None
    tcpPort: Optional[int] = None

class ModbusRequestModel(BaseModel):
    name: str
    function: int
    startAddress: int
    count: int
    slaveId: Optional[int] = 1
    data: Optional[List[int]] = None
    comment: Optional[str] = None
    order: Optional[int] = 0
    cycles: Optional[int] = None

class PollingSettings(BaseModel):
    requests: List[ModbusRequestModel]
    interval: float
    cycles: Optional[int] = None

@app.get("/ports")
async def get_ports():
    try:
        print("Getting available ports...")  # Debug log
        ports = modbus_handler.get_available_ports()
        print(f"Retrieved ports: {ports}")  # Debug log
        return {"ports": ports}
    except Exception as e:
        print(f"Error in get_ports endpoint: {str(e)}")  # Debug log
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/connect")
async def connect(settings: ConnectionSettings):
    try:
        print(f"Received connection settings: {settings}")
        modbus_settings = ModbusSettings(
            port=settings.port,
            baudrate=settings.baudRate,
            parity=settings.parity,
            stopbits=settings.stopBits,
            bytesize=settings.dataBits,
            timeout=settings.timeout,
            connection_type=settings.connectionType,
            ip_address=settings.ipAddress,
            tcp_port=settings.tcpPort
        )
        success = modbus_handler.connect(modbus_settings)
        return {"success": success}
    except Exception as e:
        print(f"Connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/disconnect")
async def disconnect():
    try:
        modbus_handler.disconnect()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/request")
async def send_request(request: ModbusRequestModel):
    try:
        modbus_request = ModbusRequest(
            name=request.name,
            function=request.function,
            start_address=request.startAddress,
            count=request.count,
            slave_id=request.slaveId,
            data=request.data,
            comment=request.comment,
            order=request.order,
            cycles=request.cycles
        )
        response = modbus_handler.send_request(modbus_request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/polling-status")
async def get_polling_status():
    global polling_status
    return polling_status

@app.post("/start-polling")
async def start_polling(settings: PollingSettings):
    global polling_thread, polling_status
    try:
        if polling_thread and polling_thread.is_alive():
            modbus_handler.stop_polling()
            polling_thread.join()

        requests = [
            ModbusRequest(
                name=req.name,
                function=req.function,
                start_address=req.startAddress,
                count=req.count,
                slave_id=req.slaveId,
                data=req.data,
                comment=req.comment,
                order=req.order,
                cycles=req.cycles
            ) for req in settings.requests
        ]

        polling_status["is_polling"] = True
        polling_status["selected_requests"] = [req.name for req in settings.requests]
        polling_status["stats"] = {}

        polling_thread = threading.Thread(
            target=modbus_handler.start_polling,
            args=(requests, settings.interval, settings.cycles)
        )
        polling_thread.start()
        return {"success": True}
    except Exception as e:
        polling_status["is_polling"] = False
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop-polling")
async def stop_polling():
    global polling_thread, polling_status
    try:
        if polling_thread and polling_thread.is_alive():
            modbus_handler.stop_polling()
            polling_thread.join()
        polling_status["is_polling"] = False
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
