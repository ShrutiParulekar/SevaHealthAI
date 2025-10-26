from fastmcp import FastMCP
import pandas as pd
from typing import List, Optional
from math import radians, sin, cos, sqrt, atan2
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
import dotenv
from langchain_chroma import Chroma
import logging

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)

# Create a basic server instance
mcp = FastMCP(name="SevaHealth AI MCP Server")

hospitals_df = pd.read_parquet("hospital_data_enriched.parquet")
pincode_coords_df = pd.read_csv("india_pincodes.csv")

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",
                google_api_key=os.getenv("GOOGLE_API_KEY"))

vector_store = Chroma(
    collection_name="sevahealth_ai_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)

@mcp.tool
async def find_hospitals(pincode: int) -> List[dict]:
    """
    Find hospitals in a given pincode area.

    Args:
        pincode (int): The pincode to search for hospitals.
    Returns:
        List[dict]: A list of hospitals in the specified pincode area.
    """
    # first get the latitude and longitude for the pincode
    coords = pincode_coords_df[pincode_coords_df["postal code "] == pincode]
    if coords.empty:
        logging.info(f"No coordinates found for pincode: {pincode}")
        return []
    lat = coords.iloc[0]["latitude"]
    lon = coords.iloc[0]["longitude"]

    logging.info(f"Coordinates for pincode {pincode}: lat={lat}, lon={lon}")

    # now find hospitals within a certain radius (e.g., 10 km)
    def haversine(lat1, lon1, lat2, lon2):

        R = 6371.0  # Earth radius in kilometers

        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance = R * c
        return distance
    
    nearby_hospitals = hospitals_df.copy()
    nearby_hospitals["distance"] = nearby_hospitals.apply(
        lambda row: haversine(lat, lon, row["latitude"], row["longitude"]), axis=1
    )

    # Filter hospitals within 10 km
    nearby_hospitals = nearby_hospitals[nearby_hospitals["distance"] <= 10].head(10)

    if nearby_hospitals.empty:
        logging.info(f"No hospitals found within 10 km for pincode: {pincode}")
        return []

    return nearby_hospitals.to_dict(orient="records")

@mcp.tool
async def search_documents(query: str) -> List[dict]:
    """
    Search for documents related to the query using the vector store.

    Args:
        query (str): The search query.

    Returns:
        List[dict]: A list of documents matching the query.
    """
    results = vector_store.similarity_search(query, k=5)
    return [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]


if __name__ == "__main__":
    mcp.run(transport="streamable-http", host="0.0.0.0", stateless_http=True,port=8000)