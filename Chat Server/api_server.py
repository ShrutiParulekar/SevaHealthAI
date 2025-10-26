from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Dict
from dotenv import load_dotenv
import os
import logging
import chatbot_agent
from fastapi.responses import StreamingResponse
import json

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

load_dotenv()

app = FastAPI(title="Chatbot API Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    thread_id: str
    user_query: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        logging.info(f"Received chat request for thread_id: {request.thread_id}")

        chat_agent = chatbot_agent.ChatbotAgent(request.thread_id)
        graph = await chat_agent.compile_graph()

        async def event_stream():
            async for event in chat_agent.stream_graph_updates(user_input=request.user_query):
                message = event.get("custom_output")
                print(message)
                yield f"data: {json.dumps({'message': message})}\n\n"
        
        return StreamingResponse(event_stream())
    
    except Exception as e:
        logging.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)