from fastapi import responses
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import InMemorySaver
import os
from dotenv import load_dotenv
import logging
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph.state import CompiledStateGraph
from typing import Any, AsyncGenerator
from langchain_core.messages import message_to_dict
from langgraph.config import get_stream_writer


load_dotenv()

logging.basicConfig(level=logging.INFO,format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MCP_SERVER_URL = os.getenv("MCP_SEVER_URL","http://localhost:8000/mcp")

class ChatbotAgent:
    def __init__(self, thread_id: str):
        self.thread_id = thread_id
        self.config = {"configurable": {"thread_id": thread_id}}
        logger.info(f"Initializing ChatbotAgent with config: {self.config}")

    async def _connect_to_mcp(self) -> None:
        try:
            logger.info("Connecting to MCP server...")
            self.client = MultiServerMCPClient({
                "sevaHealthMCP": {
                    "url": MCP_SERVER_URL,
                    "transport" : "streamable_http"
                }
            })
            self.tools = await self.client.get_tools()
            logger.info(f"Connected to MCP server and retrieved {len(self.tools)} tools.")
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise

    async def _setup_checkpointer(self) -> None:
        try:
            logger.info("Setting up checkpointing...")
            self.checkpointer = InMemorySaver()
        except Exception as e:
            logger.error(f"Failed to set up checkpointing: {e}")
            raise

    async def _setup_llm(self) -> None:
        try:
            logger.info("Setting up LLM...")
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash", 
                temperature=0,
                google_api_key=os.getenv("GOOGLE_API_KEY")
            )
        except Exception as e:
            logger.error(f"Failed to set up LLM: {e}")
            raise

    async def compile_graph(self) -> CompiledStateGraph:
        try:
            await self._connect_to_mcp()
            await self._setup_checkpointer()
            await self._setup_llm()

            logger.info("Compiling state graph...")

            self.graph_builder = StateGraph(MessagesState)
            self.graph_builder.add_node(
                "chatbot",
                self.chatbot_node,
            )
            
            self.graph_builder.add_edge(START, "chatbot")
            self.graph_builder.add_edge("chatbot", END)
            
            self.graph = self.graph_builder.compile(checkpointer=self.checkpointer)
            logger.info("State graph compiled successfully.")
            return self.graph
            
        except Exception as e:
            logger.error(f"Failed to compile state graph: {e}")
            raise
    
    async def chatbot_node(self, state: MessagesState) -> MessagesState:
        writer = get_stream_writer()
        try:
            messages = state["messages"]
            messages += [{"role" : "system", "content": """
                You are a helpful assistant that helps users by answering their questions
                about health and nearby hospitals.
                          
                To guide them to a speciality hospital first get the list of specialities
                If the user is looking for a hospital ask their pincode to find the nearest hospitals.
                          
                If the user wants in a specific language respond in that language.

                The answer should be to the audience of rural India specifically Maharashtra.
                          
                You can use the tools provided to you to get information about hospitals and specialities.
                You can also use tool for searching relevant information by passing the query. It shall perform semantic search
                over a knowledge base of health related articles and return the most relevant information.
                          
                If you don't know the answer to a question, you can use the search document tool to find the answer.
                          
                The Speciality:
                          S1 General Surgery
                            S5 Orthopedic Surgery And Procedures            
                            M3 Critical Care                                
                            S14 Polytrauma                                  
                            M16 General Medicine                            
                            S9 Urology                                      
                            M10 Pulmonology                                 
                            M8 Nephrology                                   
                            S4 Gynaecology And Obstetrics Surgery           
                            M6 Neonatal and Pediatric Medical Management    
                            M5 Infectious diseases                          
                            M14 Medical Gastroenterology                    
                            S10 Neurosurgery                                
                            M7 Cardiology                                   
                            S8 Pediatric Surgery                            
                            S11 Surgical Oncology                           
                            M9 Neurology                                    
                            M13 Endocrinology                               
                            S12 Plastic Surgery                             
                            S2 ENT                                          
                            S6 Surgical Gastroenterology                    
                            S20 Maxillofacial Surgery                       
                            M1 Medical Oncology                             
                            M18 Haematology                                 
                            M19 Haemato Oncology                            
                            S13 Burns                                       
                            S3 Ophthalmology Surgery                        
                            M11 Dermatology                                 
                            S15 Prosthesis and Orthosis                     
                            M12 Rheumatology                                
                            S7 Cardiac And Cardiothoracic Surgery           
                            M15 Interventional Radiology                    
                            M20 Physiotherapy                               
                            S21 Pediatric Cancer                            
                            M17 Mental Health Packages                      
                            M2 Radiation Oncology                           
                            S16 Maxillofacial Surgery                       
            """}]

            responses = []
            model_with_tools = self.llm.bind_tools(self.tools)
            while True:
                response = await model_with_tools.ainvoke(messages + responses)
                responses.append(response)
                writer({
                    "custom_output" : {
                        "node" : "chatbot",
                        "message" : message_to_dict(response)
                    }
                })

                if response.tool_calls:
                    for tool_call in response.tool_calls:
                        tool = next((t for t in self.tools if t.name == tool_call.get("name")), None)
                        if tool:
                            tool_call_params = {
                                "type": "tool_call",
                                "id": tool_call.get("id"),
                                "args": tool_call.get("args"),
                            }
                            tool_response = await tool.ainvoke(tool_call_params)
                            responses.append(tool_response)
                            writer({
                                "custom_output" : {
                                    "node" : "tool_call",
                                    "message" : message_to_dict(tool_response)
                                }
                            })
                else:
                    break
            return {"messages": responses}
        except Exception as e:
            logger.error(f"Error in chatbot_node: {e}")
            raise
        
    
    async def stream_graph_updates(self, user_input: str) -> AsyncGenerator[Any,None]:
        logger.info(f"Streaming graph updates for user input: {user_input}")
        async for event in self.graph.astream(
            {"messages": [{"role": "user", "content": user_input}]},
            config=self.config,
            stream_mode="custom"):
            print(event)
            yield event

if __name__ == "__main__":
    import asyncio
    import uuid


    async def main():
        thread_id = str(uuid.uuid4())
        agent = ChatbotAgent(thread_id)
        await agent.compile_graph()
        while True:
            user_input = input("User: ")
            if user_input.lower() in ["exit", "quit"]:
                logger.info("Exiting chat...")
                break
        
            async for event in agent.stream_graph_updates(user_input):
                logger.info(event.get("custom_output"))

    asyncio.run(main())