from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Union
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

@app.post("/start-polling")
async def start_polling(settings: PollingSettings):
    global polling_thread
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

        polling_thread = threading.Thread(
            target=modbus_handler.start_polling,
            args=(requests, settings.interval, settings.cycles)
        )
        polling_thread.start()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop-polling")
async def stop_polling():
    global polling_thread
    try:
        if polling_thread and polling_thread.is_alive():
            modbus_handler.stop_polling()
            polling_thread.join()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
