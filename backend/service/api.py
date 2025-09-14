from fastapi import FastAPI, File, HTTPException, UploadFile, Form, Query
from typing import List
from service.RAG.vectordb import VectorDB, Retriever
from service.RAG.rag_system import RAGSystem
from dotenv import load_dotenv
import shutil
import os

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV= os.getenv("PINECONE_ENV", "us-west1-gcp") 
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

db = VectorDB(
    api_key=PINECONE_API_KEY,
    index_name=PINECONE_INDEX_NAME,
    environment=PINECONE_ENV
)

app = FastAPI()

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def chunk_list(lst, size):
    """Yield successive chunks of size 'size' from list."""
    for i in range(0, len(lst), size):
        yield lst[i:i + size]

@app.post("/upload-pdfs")
async def upload_pdfs(
    chat_id: str = Form(...),
    files: List[UploadFile] = File(...)
    
):
    
    try:
        all_chunks = []
        folder_path = os.path.join(UPLOAD_DIR, chat_id)
        os.makedirs(folder_path, exist_ok=True)

        saved_file_paths = []
        for file in files:
            file_path = os.path.join(folder_path, file.filename)
            
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            db.Add_file(file_path, chat_id=chat_id)
        
        # Clean up saved files
        for file_path in saved_file_paths:
            if os.path.exists(file_path):
                os.remove(file_path)

        return {
            "filenames": [f.filename for f in files],
            "total_chunks_processed": len(all_chunks),
            "message": "Files uploaded"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.delete("/delete-file")
async def delete_file(
    chat_id: str = Query(..., description="Chat ID folder"),
    filename: str = Query(..., description="Filename to delete")
):
    try:

        # Delete vectors from Pinecone
        db.delete_by_file(filename, chat_id)

        return {
            "message": f"Deleted file '{filename}' and associated vectors from chat '{chat_id}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-files")
async def delete_files(
    chat_id: str = Query(..., description="Chat ID folder"),
    filenames: List[str] = Query(..., description="List of filenames to delete")
):
    try:
        results = []
        for filename in filenames:
            try:
                # Delete vectors from Pinecone
                print("Deleting file",filename,chat_id)
                db.delete_by_file(filename, chat_id)
                results.append({"filename": filename, "status": "deleted"})
            except Exception as e:
                results.append({"filename": filename, "status": "error", "detail": str(e)})

        return {
            "message": f"Processed {len(filenames)} file(s) for chat '{chat_id}'",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-chat")
async def delete_chat_endpoint(
    chat_id: str = Query(..., description="Chat ID whose vectors should be deleted")
):
    try:
        print("Deleting chat",chat_id)
        db.delete_chat(chat_id)
        return {
            "message": f"All vectors for chat_id '{chat_id}' deleted successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search-chat")
async def search_chat_endpoint(query: str, chat_id: str):
    try:
        retriever = Retriever(db=db, chat_id=chat_id)
        rag = RAGSystem(os.getenv("GROQ_API_KEY"), retriever)
        docs = rag.retrieve(query)
        text = [doc.page_content for doc in docs]
        results = rag.generate(query, text)

        # Ensure list response
        if isinstance(results, str):
            results = [results]
        print(results)
        return results


    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
