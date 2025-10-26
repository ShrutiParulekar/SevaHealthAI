import os
from PyPDF2 import PdfReader
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
import dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

dotenv.load_dotenv()

def read_pdfs_from_directory(directory_path):
    documents = []
    for filename in os.listdir(directory_path):
        if filename.endswith('.pdf'):
            filepath = os.path.join(directory_path, filename)
            reader = PdfReader(filepath)
            text = ''
            for page in reader.pages:
                text += page.extract_text()
            documents.append({'content': text, 'metadata': {'source': filename}})
    return documents

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",
                google_api_key=os.getenv("GOOGLE_API_KEY"))

vector_store = Chroma(
    collection_name="sevahealth_ai_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db",
)

# Directory containing PDFs
pdf_directory = 'PDFs'  # Replace with actual path

# Read PDFs
docs = read_pdfs_from_directory(pdf_directory)

# Initialize embeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

# Split documents into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2048,
    chunk_overlap=200)

chunked_docs = []
for doc in docs:
    splits = text_splitter.split_text(doc['content'])
    for i, chunk in enumerate(splits):
        chunked_docs.append(Document(
            page_content=chunk,
            metadata={'source': doc['metadata']['source'], 'chunk': i}
        ))

# Add documents to vector store
vector_store.add_documents(chunked_docs)