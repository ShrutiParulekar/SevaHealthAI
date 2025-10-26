# SevaHealth AI 🏥

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
[![LangChain](https://img.shields.io/badge/LangChain-Latest-orange.svg)](https://langchain.com/)
[![MCP](https://img.shields.io/badge/MCP-FastMCP-purple.svg)](https://github.com/anthropics/fastmcp)

**SevaHealth AI** is an intelligent healthcare assistant that helps users find nearby hospitals and access healthcare information using AI-powered search and recommendations. Built for the WiBD Hackathon, this project demonstrates the power of Model Context Protocol (MCP), LangGraph, and modern web technologies to create an accessible healthcare solution. It can talk in any language.

## 🌟 Features

- **🔍 Hospital Search**: Find hospitals near you based on pincode with geolocation-based search (10km radius)
- **🤖 AI-Powered Chat**: Natural language interaction powered by Google's Gemini AI
- **📚 Document Search**: RAG-based search for healthcare information and government schemes (e.g., Pradhan Mantri Matru Vandana Yojana)
- **💬 Conversation Memory**: Persistent chat history using LangGraph checkpointing
- **🎨 Modern UI**: Beautiful, responsive interface built with React and Material-UI Joy
- **⚡ Real-time Streaming**: Server-sent events (SSE) for real-time AI responses
- **🔧 MCP Integration**: Extensible architecture using Model Context Protocol

## 🏗️ Architecture

The project consists of three main components:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │ ───> │   Chat Server    │ ───> │   MCP Server    │
│   (React)       │      │   (FastAPI)      │      │   (FastMCP)     │
│                 │ <─── │   (LangGraph)    │ <─── │   (ChromaDB)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

### Frontend
- **Technology**: React 19, Vite, Material-UI Joy
- **Features**: Chat interface, markdown rendering, animations with Framer Motion
- **Port**: 5173 (default Vite port)

### Chat Server
- **Technology**: FastAPI, LangGraph, LangChain
- **Features**: AI agent orchestration, conversation management, streaming responses
- **Port**: 8001

### MCP Server
- **Technology**: FastMCP, ChromaDB, LangChain
- **Features**: Hospital search, document retrieval, vector similarity search
- **Port**: 8000

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and npm
- **Python** (3.10 or higher)
- **pip** (Python package manager)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ShrutiParulekar/WiBD_Hackathon.git

```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Google API Key for Gemini AI
GOOGLE_API_KEY=your_google_api_key_here

# MCP Server URL (default: http://localhost:8000/mcp)
MCP_SEVER_URL=http://localhost:8000/mcp
```

**Note**: Get your Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. MCP Server Setup

The MCP Server handles hospital data and document search.

```bash
cd "MCP Server"

# Install Python dependencies
pip install -r requirements.txt

# Start the MCP server
python mcp_server.py
```

The MCP server will start on `http://localhost:8000`

**Note**: The server uses pre-vectorized data stored in `chroma_langchain_db/`. If you need to re-vectorize documents, run `vectorization.py` first.

### 4. Chat Server Setup

The Chat Server orchestrates the AI agent and manages conversations.

```bash
cd "Chat Server"

# Install Python dependencies
pip install -r requirements.txt

# Start the chat server
python api_server.py
```

The chat server will start on `http://localhost:8001`

### 5. Frontend Setup

The frontend provides the user interface for interacting with the AI assistant.

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the SevaHealth AI chat interface!

## 📊 Data Preparation

The project includes data preparation scripts and datasets:

### Datasets
- **hospital_data_enriched.parquet**: Enriched hospital data with coordinates
- **india_pincodes.csv**: Indian pincode database with latitude/longitude
- **PDFs/**: Government healthcare scheme documents

### Data Processing

To prepare or analyze the data:

```bash
cd "Data Preparation"

# Install dependencies
pip install -r requirements.txt

# Parse hospital data (if needed)
python parse_hospital_data.py

# Or explore data in Jupyter notebook
jupyter notebook data_analysis.ipynb
```

## 🔧 Configuration

### Frontend Configuration

Edit `frontend/vite.config.js` to customize the Vite build:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8001'
    }
  }
})
```

### Chat Server Configuration

Update `Chat Server/api_server.py` to modify CORS settings or server port:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### MCP Server Configuration

Modify `MCP Server/mcp_server.py` to adjust search parameters:

```python
# Change search radius for hospitals
nearby_hospitals = nearby_hospitals[nearby_hospitals["distance"] <= 10]  # 10 km

# Adjust document search results
results = vector_store.similarity_search(query, k=5)  # Top 5 results
```

## 🛠️ Development

### Running in Development Mode

1. **Start all servers** in separate terminal windows:
   ```bash
   # Terminal 1: MCP Server
   cd "MCP Server" && python mcp_server.py

   # Terminal 2: Chat Server
   cd "Chat Server" && python api_server.py

   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

2. **Make changes** to the code
3. **Hot reload** is enabled for both frontend (Vite) and backend (FastAPI with `--reload`)

### Building for Production

#### Frontend Build
```bash
cd frontend
npm run build
npm run preview  # Preview production build
```

#### Backend Deployment
- Use `uvicorn` with production settings
- Configure environment variables
- Set up proper CORS policies
- Use a reverse proxy (nginx/Apache)

## 📁 Project Structure

```
WiBD_Hackathon/
├── Chat Server/              # FastAPI + LangGraph chatbot agent
│   ├── api_server.py        # FastAPI server with SSE streaming
│   ├── chatbot_agent.py     # LangGraph agent implementation
│   └── requirements.txt
├── MCP Server/               # FastMCP server for tools
│   ├── mcp_server.py        # MCP server with hospital & doc search
│   ├── vectorization.py     # Script to vectorize documents
│   ├── hospital_data_enriched.parquet
│   ├── india_pincodes.csv
│   └── chroma_langchain_db/ # Vector store database
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.jsx          # Main chat interface
│   │   ├── main.jsx
│   │   └── assets/
│   ├── package.json
│   └── vite.config.js
├── Data Preparation/         # Data processing scripts
│   ├── parse_hospital_data.py
│   ├── data_analysis.ipynb
│   └── hospital_data.csv
└── README.md
```

## 🔑 Key Technologies

### AI & LLM
- **Google Gemini**: Large language model for natural conversations
- **LangChain**: Framework for building LLM applications
- **LangGraph**: State management and agent orchestration
- **ChromaDB**: Vector database for semantic search

### Backend
- **FastAPI**: Modern Python web framework
- **FastMCP**: Model Context Protocol implementation
- **Uvicorn**: ASGI server

### Frontend
- **React 19**: UI library
- **Vite**: Build tool and dev server
- **Material-UI Joy**: Component library
- **Framer Motion**: Animation library
- **React Markdown**: Markdown rendering

### Data Processing
- **Pandas**: Data manipulation
- **BeautifulSoup**: HTML parsing
- **Geopy**: Geocoding utilities

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is created for the WiBD Hackathon. Please check with the repository owner for licensing information.

## 👥 Team

- **Repository Owner**: [ShrutiParulekar](https://github.com/ShrutiParulekar)
- **Contributors**: [Add your team members here]

## 🐛 Troubleshooting

### Common Issues

**1. MCP Server Connection Failed**
```bash
# Check if MCP server is running
curl http://localhost:8000/mcp

# Verify environment variables
echo $MCP_SEVER_URL
```

**2. Google API Key Issues**
- Ensure your API key is valid and has Gemini API access enabled
- Check quota limits in Google Cloud Console

**3. Frontend Can't Connect to Backend**
- Verify all servers are running
- Check CORS settings in `api_server.py`
- Ensure ports are not blocked by firewall

**4. ChromaDB Errors**
```bash
# Rebuild vector database if corrupted
cd "MCP Server"
rm -rf chroma_langchain_db/
python vectorization.py
```

**5. Port Already in Use**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in respective config files
```

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on [GitHub](https://github.com/ShrutiParulekar/WiBD_Hackathon/issues)
- Contact the team members

## 🎯 Future Enhancements

- [ ] Add user authentication
- [ ] Implement appointment booking
- [ ] Add multi-language support
- [ ] Mobile app version
- [ ] Integration with more healthcare APIs
- [ ] Add hospital reviews and ratings
- [ ] Telemedicine features
- [ ] Emergency services integration

## 🙏 Acknowledgments

- **WiBD Hackathon** for organizing the event
- **Google** for Gemini AI API
- **Anthropic** for MCP framework inspiration
- All open-source contributors

---



