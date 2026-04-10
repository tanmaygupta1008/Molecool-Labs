from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rag_pipeline import ChemistryRAG
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(title="ChemistryRAG API")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading ChemistryRAG pipeline... This may take a few seconds.")
# Initialize the model once at startup to avoid loading delays per request
try:
    rag = ChemistryRAG()
    print("ChemistryRAG loaded successfully!")
except Exception as e:
    print(f"Error loading ChemistryRAG: {e}")
    rag = None

class PredictRequest(BaseModel):
    query: str
    session_id: str = "default_session"

@app.post("/predict")
async def predict(req: PredictRequest):
    if not rag:
        raise HTTPException(status_code=500, detail="ChemistryRAG model failed to initialize on server.")
    
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
        
    try:
        start_time = time.time()
        answer, docs = rag.get_answer(req.query)
        duration = time.time() - start_time
        
        # Serialize docs to simple dictionaries so Next.js can read them easily
        serialized_docs = []
        for doc in docs:
            serialized_docs.append({
                "content": getattr(doc, "page_content", str(doc)),
                "metadata": getattr(doc, "metadata", {})
            })
            
        return {
            "message": answer,
            "docs": serialized_docs,
            "source": "ChemistryRAG Model",
            "latency_sec": round(duration, 2)
        }
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    if not rag:
        return {"status": "error", "message": "Model not loaded"}
    return {"status": "ok", "message": "ChemistryRAG is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
