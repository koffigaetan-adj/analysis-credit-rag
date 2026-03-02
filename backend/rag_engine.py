import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings 
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from dotenv import load_dotenv

load_dotenv()

PERSIST_DIRECTORY = "./db/chroma_db"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# 1. Embedding Local (HuggingFace)
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def process_bank_rules(file_path):
    """
    Idéal pour ingérer la politique de crédit de la banque (pas les dossiers clients).
    """
    print(f"--- Début de l'indexation de la règle : {file_path} ---")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    texts = text_splitter.split_documents(documents)
    
    print(f"Création de {len(texts)} morceaux de texte...")

    vectordb = Chroma.from_documents(
        documents=texts, 
        embedding=embeddings,
        persist_directory=PERSIST_DIRECTORY
    )
    print("--- Base de connaissance interne mise à jour ---")
    return True

def ask_bank_knowledge(query):
    """
    Interroge la base de connaissances interne (ChromaDB)
    """
    vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
    
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile", 
        temperature=0.1
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectordb.as_retriever(search_kwargs={"k": 5})
    )
    
    result = qa_chain.invoke({"query": query})
    return result['result']